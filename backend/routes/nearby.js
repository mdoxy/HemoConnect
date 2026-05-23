import express from 'express';
import Request from '../models/Request.js';
import { getCompatibleBloodGroups } from '../services/matching/donorMatcher.js';

const router = express.Router();

/**
 * scoreToPriorityLevel — converts numeric score to named priority level.
 * Used for UI styling: critical (red/pulse), high (orange), medium (yellow), low (gray).
 *
 * @param {number} score
 * @returns {'critical'|'high'|'medium'|'low'}
 */
export function scoreToPriorityLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

/**
 * GET /api/nearby/requests
 *
 * Location-aware priority feed — the core of the live emergency dashboard.
 *
 * Query params:
 *   lat       {number}  user latitude
 *   lng       {number}  user longitude
 *   radius    {number}  search radius in metres (default 25000 = 25 km)
 *   bloodGroup {string} optional blood group filter
 *   level     {string}  optional priority level filter (critical|high|medium|low)
 *   limit     {number}  max results (default 50)
 *
 * Ranking formula (as discussed):
 *   1. priorityScore DESC  — critical requests first
 *   2. distance ASC        — closer requests win ties
 *   3. submittedAt ASC     — older requests win further ties (starvation prevention)
 */
router.get('/requests', async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 25000,
      bloodGroup,
      level,
      limit = 50,
    } = req.query;

    // ── Build MongoDB query ───────────────────────────────────────────────
    const query = { status: 'Pending' };

    // Geospatial filter — only when coordinates are provided
    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)], // MongoDB: [lng, lat]
          },
          $maxDistance: Number(radius),
        },
      };
    }

    // Blood group compatibility filter
    if (bloodGroup) {
      const compatibleGroups = getCompatibleBloodGroups(bloodGroup);
      query.bloodGroup = { $in: compatibleGroups };
    }

    // Priority level filter
    if (level && ['critical', 'high', 'medium', 'low'].includes(level)) {
      query.priorityLevel = level;
    }

    const rawRequests = await Request.find(query)
      .select('_id patientName bloodGroup unitsRequired hospitalName location priorityScore priorityLevel emergency hoursLeft requiredDate reason submittedAt status')
      .limit(Number(limit))
      .lean();

    // ── Compute distance for each request ────────────────────────────────
    const enriched = rawRequests.map((r) => {
      let distanceKm = null;

      if (
        lat != null && lng != null &&
        r.location?.coordinates?.length === 2
      ) {
        const [rLng, rLat] = r.location.coordinates;
        distanceKm = haversineKm(Number(lat), Number(lng), rLat, rLng);
      }

      return {
        ...r,
        distanceKm,
        // Ensure priorityLevel is always set (fallback for older docs)
        priorityLevel: r.priorityLevel || scoreToPriorityLevel(r.priorityScore || 0),
      };
    });

    // ── Sort: priority DESC, then distance ASC, then age ASC ─────────────
    const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    enriched.sort((a, b) => {
      const la = levelOrder[a.priorityLevel] ?? 3;
      const lb = levelOrder[b.priorityLevel] ?? 3;
      if (la !== lb) return la - lb;

      // Same level → closer first
      if (a.distanceKm != null && b.distanceKm != null && a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }

      // Same level + distance → older request first (anti-starvation)
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });

    res.json({
      success: true,
      count: enriched.length,
      userLocation: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
      radiusKm: Number(radius) / 1000,
      data: enriched,
    });
  } catch (error) {
    // $near fails if 2dsphere index doesn't exist — fall back to all pending
    if (error.message?.includes('unable to find index') || error.message?.includes('2dsphere')) {
      console.warn('[NearbyAPI] 2dsphere index missing — returning all pending (no geo filter).');
      try {
        const fallback = await Request.find({ status: 'Pending' })
          .select('_id patientName bloodGroup unitsRequired hospitalName location priorityScore priorityLevel emergency hoursLeft requiredDate reason submittedAt status')
          .sort({ priorityScore: -1 })
          .limit(50)
          .lean();

        return res.json({
          success: true,
          count: fallback.length,
          fallback: true,
          data: fallback.map((r) => ({
            ...r,
            distanceKm: null,
            priorityLevel: r.priorityLevel || scoreToPriorityLevel(r.priorityScore || 0),
          })),
        });
      } catch (e2) {
        return res.status(500).json({ success: false, message: e2.message });
      }
    }
    console.error('[NearbyAPI] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * haversineKm — great-circle distance between two lat/lng points.
 * @returns {number} distance in kilometres
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export default router;
