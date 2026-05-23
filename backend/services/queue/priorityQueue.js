import { Heap } from 'heap-js';

/**
 * priorityQueue.js — In-Memory Max-Heap Priority Queue
 *
 * Uses heap-js to maintain a max-heap ordered by priorityScore.
 * Tie-breaking rule: older requests (earlier createdAt) go first
 * — this prevents request starvation.
 *
 * ⚠️  IMPORTANT DESIGN NOTE (good for viva):
 *     This is an in-memory structure. It resets on server restart.
 *     For production, replace with Redis/BullMQ backed distributed queue.
 *     For a final-year project, this is intentional and acceptable.
 *
 * Complexity:
 *   push (insert)  → O(log n)
 *   pop  (remove)  → O(log n)
 *   peek (top)     → O(1)
 */

// Comparator: higher score = higher priority. Equal scores → older request first.
const comparator = (a, b) => {
  if (b.score !== a.score) {
    return b.score - a.score; // max-heap by score
  }
  // Starvation prevention: older request wins the tie
  return new Date(a.createdAt) - new Date(b.createdAt);
};

// Singleton heap instance — shared across the entire process
const priorityQueue = new Heap(comparator);

/**
 * addToQueue — Push a blood request into the priority queue.
 * @param {string} requestId
 * @param {number} score
 * @param {Date|string} createdAt
 * @param {string} bloodGroup
 */
export function addToQueue({ requestId, score, createdAt, bloodGroup }) {
  priorityQueue.push({ requestId, score, createdAt, bloodGroup });
  console.log(
    `[PriorityQueue] Added requestId=${requestId} score=${score} | Queue size=${priorityQueue.size()}`
  );
}

/**
 * processNext — Pop and return the highest-priority request.
 * Returns null if the queue is empty.
 * @returns {{ requestId, score, createdAt, bloodGroup } | null}
 */
export function processNext() {
  if (priorityQueue.isEmpty()) {
    console.log('[PriorityQueue] Queue is empty. Nothing to process.');
    return null;
  }
  const top = priorityQueue.pop();
  console.log(
    `[PriorityQueue] Processing requestId=${top.requestId} score=${top.score} | Remaining=${priorityQueue.size()}`
  );
  return top;
}

/**
 * peekTop — View the highest-priority request WITHOUT removing it.
 * @returns {{ requestId, score, createdAt, bloodGroup } | null}
 */
export function peekTop() {
  if (priorityQueue.isEmpty()) return null;
  return priorityQueue.peek();
}

/**
 * getQueueSnapshot — Returns a sorted array of all items currently in queue.
 * Useful for admin dashboards / debugging.
 * @returns {Array}
 */
export function getQueueSnapshot() {
  return priorityQueue.toArray().sort(comparator);
}

/**
 * getQueueSize — Returns current number of items in the queue.
 * @returns {number}
 */
export function getQueueSize() {
  return priorityQueue.size();
}

/**
 * rebuildQueue — Re-populates the heap from an array of requests.
 * Call this after a server restart to restore queue state from DB.
 * @param {Array} requests — array of { requestId, score, createdAt, bloodGroup }
 */
export function rebuildQueue(requests) {
  priorityQueue.clear();
  requests.forEach((r) => priorityQueue.push(r));
  console.log(`[PriorityQueue] Rebuilt with ${priorityQueue.size()} pending requests.`);
}

export default priorityQueue;
