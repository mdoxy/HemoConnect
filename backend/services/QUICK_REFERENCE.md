/**
 * MATCHING ALGORITHM - QUICK IMPLEMENTATION GUIDE
 * Copy-paste ready code for integrating the matching service
 */

# MATCHING ALGORITHM - QUICK REFERENCE

## 1. Import & Basic Usage

```javascript
const {
  findMatchingDonors,
  orchestrateMatching,
  scoreDonor,
  getCompatibleDonorGroups,
  notifyDonor,
  lockDonorToRequest
} = require('../services/matchingService');
```

## 2. Find Matching Donors (Complete Flow)

```javascript
// In bloodRequestController.js or a route handler

async function createBloodRequest(req, res) {
  try {
    const { bloodGroup, urgency, hospitalId } = req.body;
    
    // 1. Create request in database
    const request = await BloodRequest.create({
      bloodGroup,
      urgency,
      hospitalId,
      location: {
        type: 'Point',
        coordinates: req.user.location.coordinates  // [lng, lat]
      },
      status: 'open',
      createdAt: new Date()
    });

    // 2. Find matching donors (async, non-blocking)
    findMatchingDonors(request, {
      maxRadiusMeters: 50000,
      maxResults: 10,
      cooldownDays: 90,
      minScore: 20
    })
    .then(async (candidates) => {
      // 3. Notify each candidate
      for (const donor of candidates) {
        await notifyDonor(donor, request, notificationService);
      }
      
      console.log(`Matched ${candidates.length} donors for request ${request._id}`);
    })
    .catch(error => {
      console.error('Matching failed:', error.message);
      // Fallback: Manual notification to nearby hospitals
    });

    return res.status(201).json({
      status: 'success',
      data: request,
      message: 'Request created. Finding donors...'
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}
```

## 3. Donor Acceptance & Locking

```javascript
// Real-time event handler (WebSocket/Socket.io)

socket.on('donor-accept', async (data) => {
  const { requestId, donorId } = data;
  
  try {
    // 1. Lock donor to request
    const result = await lockDonorToRequest(requestId, donorId);
    
    // 2. Emit success to donor
    socket.emit('accept-success', {
      status: 'locked',
      message: 'Your donation is scheduled!'
    });
    
    // 3. Emit update to hospital
    io.to(`hospital-${result.hospitalId}`).emit('donor-locked', result);
    
  } catch (error) {
    socket.emit('error', { message: error.message });
  }
});
```

## 4. Check Compatibility (Utility Function)

```javascript
// Quick check if donor can give to patient

function canDonate(donorBloodGroup, patientBloodGroup) {
  const compatible = getCompatibleDonorGroups(patientBloodGroup);
  return compatible.includes(donorBloodGroup);
}

// Examples:
canDonate('O-', 'AB+')  // true (universal donor)
canDonate('AB+', 'O-')  // false
canDonate('A+', 'AB+')  // true
```

## 5. Score Individual Donor (Manual Check)

```javascript
// For debugging or manual matching

const donor = await Donor.findById('donor123');
const request = await BloodRequest.findById('req456');

const score = scoreDonor(donor, request, {
  maxRadiusMeters: 50000,
  cooldownDays: 90
});

console.log(score);
// Output:
// {
//   totalScore: 92.5,
//   components: { urgency: 40, distance: 25.2, metadata: 17, availability: 10 },
//   details: { urgencyScore: 100, distanceMeters: 8000, ... }
// }
```

## 6. Database Index Setup (One-Time)

```javascript
// In MongoDB or Mongoose initialization

// Create geospatial index
await db.donors.createIndex({ location: "2dsphere" });

// Optional: Create indexes for queries
await db.donors.createIndex({ bloodGroup: 1, available: 1 });
await db.donors.createIndex({ lastDonationDate: 1 });

// Optional: TTL index for NotificationLog (auto-expire after 30 days)
await db.notificationLogs.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);
```

## 7. Cron Job: Auto-Escalation (If No Response)

```javascript
// In a background job runner (node-cron, agenda, etc.)

async function escalateExpiredMatches() {
  // Find requests with no donor response after 6 hours
  const expiredNotifications = await NotificationLog.find({
    status: 'sent',
    createdAt: { $lt: new Date(Date.now() - 6 * 60 * 60 * 1000) }
  });

  for (const notification of expiredNotifications) {
    const request = await BloodRequest.findById(notification.requestId);
    
    if (request.status === 'open') {
      // Mark as expired and try next candidate
      await NotificationLog.updateOne(
        { _id: notification._id },
        { status: 'expired', expiredAt: new Date() }
      );

      // Find and notify next highest-scored donor
      const nextMatches = await findMatchingDonors(request, { maxResults: 5 });
      const nextDonor = nextMatches.find(
        d => !await NotificationLog.exists({ 
          requestId: request._id, 
          donorId: d._id 
        })
      );

      if (nextDonor) {
        await notifyDonor(nextDonor, request, notificationService);
      }
    }
  }
}

// Schedule for every hour
cron.schedule('0 * * * *', escalateExpiredMatches);
```

## 8. Analytics: Match Success Rate

```javascript
// Track matching success metrics

async function getMatchingAnalytics(dateRange) {
  const requests = await BloodRequest.find({
    createdAt: { $gte: dateRange.start, $lte: dateRange.end }
  });

  const metrics = {
    total_requests: requests.length,
    matched: requests.filter(r => r.donor).length,
    success_rate: 0,
    avg_time_to_match_minutes: 0,
    by_urgency: {}
  };

  metrics.success_rate = (metrics.matched / metrics.total_requests * 100).toFixed(2) + '%';

  // Average time to match
  const times = requests
    .filter(r => r.donor && r.lockedAt)
    .map(r => (r.lockedAt - r.createdAt) / (1000 * 60)); // minutes
  
  metrics.avg_time_to_match_minutes = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);

  // Success by urgency
  for (const urgency of ['critical', 'high', 'medium', 'low']) {
    const urgencyRequests = requests.filter(r => r.urgency === urgency);
    const matched = urgencyRequests.filter(r => r.donor).length;
    metrics.by_urgency[urgency] = {
      total: urgencyRequests.length,
      matched,
      rate: (matched / urgencyRequests.length * 100).toFixed(1) + '%'
    };
  }

  return metrics;
}

// Usage
const analytics = await getMatchingAnalytics({
  start: new Date('2026-01-01'),
  end: new Date('2026-01-31')
});

console.log(analytics);
// Output:
// {
//   total_requests: 150,
//   matched: 142,
//   success_rate: 94.67%,
//   avg_time_to_match_minutes: 18.5,
//   by_urgency: {
//     critical: { total: 10, matched: 10, rate: 100% },
//     high: { total: 30, matched: 29, rate: 96.67% },
//     medium: { total: 80, matched: 76, rate: 95% },
//     low: { total: 30, matched: 27, rate: 90% }
//   }
// }
```

## 9. Fallback: Manual Matching

```javascript
// If automated matching fails, allow manual selection

async function manualMatchDonor(requestId, donorId) {
  const request = await BloodRequest.findById(requestId);
  const donor = await Donor.findById(donorId);

  // Validate compatibility
  if (!getCompatibleDonorGroups(request.bloodGroup).includes(donor.bloodGroup)) {
    throw new AppError('Blood group incompatible', 400);
  }

  // Lock donor
  await lockDonorToRequest(requestId, donorId);

  return {
    status: 'success',
    message: 'Donor manually matched'
  };
}
```

## 10. Testing: Mock Data

```javascript
// Generate test donors for development

async function createTestDonors(count = 100) {
  const testDonors = Array.from({ length: count }, (_, i) => ({
    name: `Test Donor ${i + 1}`,
    email: `donor${i + 1}@test.com`,
    phone: `98${String(i).padStart(8, '0')}`,
    bloodGroup: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'][i % 8],
    location: {
      type: 'Point',
      coordinates: [80.27 + (Math.random() - 0.5) * 0.5, 13.08 + (Math.random() - 0.5) * 0.5]
      // Random locations within ~50km of Chennai
    },
    available: Math.random() > 0.2,  // 80% available
    lastDonationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    donationCount: Math.floor(Math.random() * 20),
    isVerified: Math.random() > 0.3,  // 70% verified
    createdAt: new Date()
  }));

  return Donor.insertMany(testDonors);
}

// Usage in tests
beforeEach(async () => {
  await createTestDonors(100);
});

it('should match donors within radius', async () => {
  const request = {
    bloodGroup: 'AB+',
    location: { type: 'Point', coordinates: [80.27, 13.08] },
    urgency: 'critical'
  };

  const matches = await findMatchingDonors(request);
  expect(matches.length).toBeGreaterThan(0);
});
```

## 11. Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `No matching donors found` | No compatible donors in radius | Increase radius, check blood type |
| `Request already locked` | Another donor accepted first | Check request.status, verify lock |
| `Invalid coordinates order` | [lat, lng] instead of [lng, lat] | Use GeoJSON format: [longitude, latitude] |
| `Geospatial index missing` | Index not created on location field | Run: `db.donors.createIndex({location: "2dsphere"})` |
| `Cooldown filter too strict` | 90 days too long for urgent cases | Use shorter cooldown for critical requests |

## 12. Performance Optimization Tips

**For 10 Million Donors:**

```javascript
// 1. Use .lean() to skip Mongoose overhead
const donors = await Donor.find({...}).lean();  // ~30% faster

// 2. Select only needed fields
const donors = await Donor.find({...})
  .select('_id name bloodGroup location distance lastDonationDate')
  .lean();

// 3. Use .limit() to reduce memory
const donors = await Donor.find({...})
  .limit(100)
  .lean();

// 4. Index optimization
// Create combined index for common queries
db.donors.createIndex({ 
  bloodGroup: 1, 
  available: 1, 
  location: "2dsphere" 
});

// 5. Cache blood group compatibility (never changes)
const CACHE = {
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  // ... other blood groups
};

// 6. Async notifications (don't block matching)
setImmediate(() => {
  for (const donor of candidates) {
    notifyDonor(donor, request, service);
  }
});
```

## 13. Monitoring & Logging

```javascript
// Log all matching operations for audit

function logMatchingEvent(event, details) {
  const log = {
    timestamp: new Date(),
    event,
    requestId: details.requestId,
    donorId: details.donorId,
    score: details.score,
    action: details.action,
    outcome: details.outcome
  };

  console.log(`[MATCHING] ${JSON.stringify(log)}`);
  
  // Store in database for analytics
  MatchingLog.create(log);
}

// Usage
logMatchingEvent('DONOR_SCORED', {
  requestId: 'req123',
  donorId: 'donor456',
  score: 92.5,
  action: 'notification_sent',
  outcome: 'success'
});

logMatchingEvent('DONOR_LOCKED', {
  requestId: 'req123',
  donorId: 'donor456',
  score: 92.5,
  action: 'lock_request',
  outcome: 'locked'
});
```

---

## Integration Checklist

- [ ] Import matchingService in blood request controller
- [ ] Create geospatial index on Donor.location
- [ ] Setup NotificationLog collection
- [ ] Implement real-time WebSocket listener for donor acceptance
- [ ] Create cron job for auto-escalation
- [ ] Test with mock donors
- [ ] Monitor matching success rate
- [ ] Setup alerts for failed matches
- [ ] Document database migrations
- [ ] Train staff on new matching system

---

## Next Steps

1. **Immediate**: Integrate matchingService into controllers
2. **Short-term**: Setup real-time acceptance listening (WebSocket)
3. **Medium-term**: Implement analytics dashboard
4. **Long-term**: Add ML prediction models

Ready to integrate! 🚀
