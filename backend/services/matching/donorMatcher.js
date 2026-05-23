import DonorApplication from '../../models/Donor.js';

/**
 * donorMatcher.js — Geospatial Donor Matching Service
 *
 * Finds approved donors within a given radius who match the required blood group.
 *
 * Uses MongoDB $near geospatial query with the 2dsphere index on donor location.
 * This is an O(log n) indexed query — industry-grade performance.
 *
 * Blood group compatibility map:
 *   Each key (needed group) lists all donor groups that CAN donate to it.
 */

const COMPATIBILITY_MAP = {
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // universal recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
};

/**
 * findNearbyDonors
 *
 * @param {string}  requiredBloodGroup  — blood group the patient needs
 * @param {number}  latitude            — patient/hospital latitude
 * @param {number}  longitude           — patient/hospital longitude
 * @param {number}  radiusMeters        — search radius in metres (default 10 km)
 * @param {number}  limit               — max donors to return (default 20)
 * @returns {Promise<Array>}            — array of matched donor documents
 */
export async function findNearbyDonors({
  requiredBloodGroup,
  latitude,
  longitude,
  radiusMeters = 10000,
  limit = 20,
}) {
  try {
    // Get all compatible blood groups for the required group
    const compatibleGroups = COMPATIBILITY_MAP[requiredBloodGroup] || [requiredBloodGroup];

    // If donors have a location field with 2dsphere index, use $near
    // Falling back gracefully if donors don't have location data yet
    let query = {
      bloodGroup: { $in: compatibleGroups },
      status: 'Approved',
    };

    // Only add geospatial filter when coords are provided
    if (latitude != null && longitude != null) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude], // MongoDB uses [lng, lat]
          },
          $maxDistance: radiusMeters,
        },
      };
    }

    const donors = await DonorApplication.find(query).limit(limit);

    console.log(
      `[DonorMatcher] Found ${donors.length} compatible donors` +
        (latitude != null ? ` within ${radiusMeters / 1000} km` : ' (no location filter)')
    );

    return donors;
  } catch (error) {
    // $near fails if 2dsphere index doesn't exist yet — fall back to blood-group-only search
    if (error.message && error.message.includes('2dsphere')) {
      console.warn(
        '[DonorMatcher] 2dsphere index missing, falling back to blood-group-only search.'
      );
      const compatibleGroups = COMPATIBILITY_MAP[requiredBloodGroup] || [requiredBloodGroup];
      return DonorApplication.find({
        bloodGroup: { $in: compatibleGroups },
        status: 'Approved',
      }).limit(limit);
    }
    console.error('[DonorMatcher] Error finding donors:', error.message);
    return [];
  }
}

/**
 * getCompatibleBloodGroups
 * Utility: returns the list of donor groups compatible with a patient's required group.
 * @param {string} requiredGroup
 * @returns {string[]}
 */
export function getCompatibleBloodGroups(requiredGroup) {
  return COMPATIBILITY_MAP[requiredGroup] || [requiredGroup];
}
