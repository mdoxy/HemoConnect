import express from 'express';
import PriorityRule from '../models/PriorityRule.js';
import Request from '../models/Request.js';
import { runEscalation } from '../cron/escalationJob.js';
import {
  getQueueSnapshot,
  getQueueSize,
  peekTop,
  processNext,
  rebuildQueue,
} from '../services/queue/priorityQueue.js';
import { calculatePriority } from '../services/priority/calculatePriority.js';
import { findNearbyDonors } from '../services/matching/donorMatcher.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY RULES — CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/priority/rules
 * List all priority rules (sorted by priority field)
 */
router.get('/rules', async (req, res) => {
  try {
    const rules = await PriorityRule.find().sort({ priority: 1, createdAt: 1 });
    res.json({ success: true, count: rules.length, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/priority/rules
 * Create a new priority rule
 */
router.post('/rules', async (req, res) => {
  try {
    const rule = new PriorityRule(req.body);
    const saved = await rule.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/priority/rules/:id
 * Update an existing priority rule (e.g. change score, enable/disable)
 */
router.put('/rules/:id', async (req, res) => {
  try {
    const updated = await PriorityRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/priority/rules/:id
 * Delete a priority rule
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    const deleted = await PriorityRule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY QUEUE — STATUS & OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/priority/queue/status
 * Shows current queue size and top item
 */
router.get('/queue/status', (req, res) => {
  res.json({
    success: true,
    queueSize: getQueueSize(),
    topRequest: peekTop(),
    snapshot: getQueueSnapshot(),
  });
});

/**
 * POST /api/priority/queue/process
 * Manually pop and process the highest priority request
 */
router.post('/queue/process', async (req, res) => {
  try {
    const top = processNext();
    if (!top) {
      return res.json({ success: true, message: 'Queue is empty', processed: null });
    }

    // Find nearby donors for this request
    const request = await Request.findById(top.requestId);
    let donors = [];
    if (request) {
      donors = await findNearbyDonors({
        requiredBloodGroup: top.bloodGroup,
        latitude: request.latitude || null,
        longitude: request.longitude || null,
      });
    }

    res.json({
      success: true,
      processed: top,
      matchedDonors: donors.length,
      donors: donors.map((d) => ({
        id: d._id,
        fullName: d.fullName,
        bloodGroup: d.bloodGroup,
        phone: d.phone,
        email: d.email,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/priority/queue/rebuild
 * Rebuild the in-memory queue from all pending DB requests.
 * Useful after server restart.
 */
router.post('/queue/rebuild', async (req, res) => {
  try {
    const pending = await Request.find({ status: 'Pending' }).select(
      '_id priorityScore submittedAt bloodGroup'
    );

    const items = pending.map((r) => ({
      requestId: String(r._id),
      score: r.priorityScore || 0,
      createdAt: r.submittedAt,
      bloodGroup: r.bloodGroup,
    }));

    rebuildQueue(items);

    res.json({
      success: true,
      message: `Queue rebuilt with ${items.length} pending requests`,
      queueSize: getQueueSize(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SCORE CALCULATOR — Test endpoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/priority/score/calculate
 * Body: any blood request fields
 * Returns the priority score that would be assigned — useful for testing rules
 */
router.post('/score/calculate', async (req, res) => {
  try {
    const score = await calculatePriority(req.body);
    res.json({ success: true, score, inputData: req.body });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ESCALATION — Manual trigger
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/priority/escalate
 * Manually trigger the escalation job (normally runs on cron every 30 mins)
 */
router.post('/escalate', async (req, res) => {
  try {
    await runEscalation();
    res.json({ success: true, message: 'Escalation job executed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DONOR MATCHING — Direct lookup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/priority/donors/match?bloodGroup=O-&lat=12.9&lng=77.5&radius=10000
 * Find compatible nearby donors for a given blood group and location
 */
router.get('/donors/match', async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius } = req.query;

    if (!bloodGroup) {
      return res.status(400).json({ success: false, message: 'bloodGroup is required' });
    }

    const donors = await findNearbyDonors({
      requiredBloodGroup: bloodGroup,
      latitude: lat ? Number(lat) : null,
      longitude: lng ? Number(lng) : null,
      radiusMeters: radius ? Number(radius) : 10000,
    });

    res.json({
      success: true,
      count: donors.length,
      donors: donors.map((d) => ({
        id: d._id,
        fullName: d.fullName,
        bloodGroup: d.bloodGroup,
        phone: d.phone,
        email: d.email,
        status: d.status,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
