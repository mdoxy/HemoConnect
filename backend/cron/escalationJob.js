import cron from 'node-cron';
import Request from '../models/Request.js';
import { addToQueue } from '../services/queue/priorityQueue.js';
import { scoreToPriorityLevel } from '../routes/nearby.js';
import { io } from '../server.js';

/**
 * escalationJob.js — Time-Based Priority Escalation Cron Job
 *
 * Runs every 30 minutes.
 * Finds pending blood requests that have been waiting too long and
 * increases their priorityScore so they bubble up in the queue.
 *
 * Escalation Tiers:
 *   > 1 hour  waiting → +10 points
 *   > 3 hours waiting → +20 points  (cumulative: +30 total per cycle)
 *   > 6 hours waiting → +30 points  (cumulative: +60 total per cycle)
 *
 * This makes the system TIME-AWARE — requests don't starve forever.
 * Great design concept for viva: "dynamic priority escalation."
 */

/**
 * Calculate how many hours a request has been waiting.
 * @param {Date} submittedAt
 * @returns {number} hours elapsed
 */
function getWaitingHours(submittedAt) {
  const now = new Date();
  const diff = now - new Date(submittedAt);
  return diff / (1000 * 60 * 60); // convert ms → hours
}

/**
 * Determine score escalation based on waiting duration.
 * @param {number} waitingHours
 * @returns {number} bonus score to add
 */
function getEscalationBonus(waitingHours) {
  if (waitingHours > 6) return 30;
  if (waitingHours > 3) return 20;
  if (waitingHours > 1) return 10;
  return 0;
}

/**
 * runEscalation — main job logic (exported so it can be tested manually).
 */
export async function runEscalation() {
  console.log('[EscalationJob] Running at', new Date().toISOString());

  try {
    const pendingRequests = await Request.find({ status: 'Pending' });

    if (pendingRequests.length === 0) {
      console.log('[EscalationJob] No pending requests found.');
      return;
    }

    let escalatedCount = 0;

    for (const req of pendingRequests) {
      const waitingHours = getWaitingHours(req.submittedAt);
      const bonus = getEscalationBonus(waitingHours);

      if (bonus > 0) {
        const currentScore = req.priorityScore || 0;
        const newScore = currentScore + bonus;
        const newLevel = scoreToPriorityLevel(newScore);

        await Request.findByIdAndUpdate(req._id, { priorityScore: newScore, priorityLevel: newLevel });

        addToQueue({
          requestId: String(req._id),
          score: newScore,
          createdAt: req.submittedAt,
          bloodGroup: req.bloodGroup,
        });

        // Emit real-time escalation event to live dashboards
        try {
          io.emit('request-escalated', {
            requestId: String(req._id),
            newScore,
            newLevel,
          });
        } catch (socketErr) {
          console.warn('[EscalationJob] Socket.IO emit failed (non-fatal):', socketErr.message);
        }

        escalatedCount++;
        console.log(
          `[EscalationJob] Escalated requestId=${req._id} | ` +
            `waited=${waitingHours.toFixed(1)}h | bonus=+${bonus} | newScore=${newScore} | level=${newLevel}`
        );
      }
    }

    console.log(
      `[EscalationJob] Done. Escalated ${escalatedCount}/${pendingRequests.length} requests.`
    );
  } catch (error) {
    console.error('[EscalationJob] Error during escalation:', error.message);
  }
}

// startEscalationJob — registers the cron schedule.
// Call this once during server startup.
// Cron expression: every-30-minutes (30 * * * *)
export function startEscalationJob() {
  cron.schedule('*/30 * * * *', runEscalation);
  console.log('[EscalationJob] Scheduled — runs every 30 minutes.');
}
