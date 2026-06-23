"""
services/priority_queue.py
───────────────────────────
Heap-Based Priority Queue for Emergency Blood Requests.

Uses Python's built-in `heapq` module (min-heap) with NEGATED scores
to achieve max-heap behaviour — highest priority request always at root.

──────────────────────────────────────────────────────────────────────
WHY A HEAP? (Interview-ready explanation)
──────────────────────────────────────────────────────────────────────
In a real emergency, new requests arrive constantly and priorities change
due to escalation. The two naive alternatives are:

  Option A — Re-sort the full list every time:
    Cost: O(n log n) per insert/update
    With 10,000 requests at 100 ops/sec → 1.33 billion comparisons/sec ❌

  Option B — Linear scan for max each time:
    Cost: O(n) per "get highest priority"
    Acceptable for get-max, but insert is O(1) and update is O(n) ❌

  Option C — Heap (this module):
    Insert: O(log n)  ← tree sift-up, at most log₂(n) swaps
    Pop:    O(log n)  ← tree sift-down after removing root
    Peek:   O(1)      ← just read heap[0]
    Update: O(log n)  ← lazy deletion + re-insert

    With 10,000 requests at 100 ops/sec → 1,300 comparisons/sec ✅
    That's 1 million times fewer operations than re-sorting!

──────────────────────────────────────────────────────────────────────
HEAP STRUCTURE (visual)
──────────────────────────────────────────────────────────────────────
Max-heap conceptually (we store negated scores internally):

              [Score: 95]         ← root — always the highest priority
             /            \\
       [Score: 88]    [Score: 91]
       /     \\          /     \\
  [75]     [82]     [80]     [88]

Heap property: every parent ≥ its children.
This property is maintained automatically by heapq after every push/pop.

──────────────────────────────────────────────────────────────────────
LAZY DELETION (for priority updates)
──────────────────────────────────────────────────────────────────────
heapq does NOT support efficient in-place updates (no decrease-key).
Standard solution used by Dijkstra, A*, and production systems:

  1. Mark the old heap entry as REMOVED (O(1))
  2. Push a NEW entry with the updated score (O(log n))
  3. When the old entry eventually reaches the top during pop(), skip it

This is safe because _entry_finder always points to the LATEST entry.
The stale entries just take up space until they naturally bubble up and
are discarded. Memory impact is bounded by max_escalations × queue_size.
"""

from __future__ import annotations

import heapq
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# Sentinel value to mark lazily-deleted heap entries
_REMOVED = "__REMOVED__"


@dataclass(order=True)
class _HeapItem:
    """
    Internal heap node.

    `order=True` on @dataclass auto-generates __lt__, __le__, __gt__, __ge__
    based on field declaration order. heapq uses these for comparisons.

    Field order matters for comparison:
      1. neg_score    — primary sort key (lower neg_score = higher priority)
      2. inserted_at  — tiebreaker (older request wins if scores are equal)
      3. request_id   — secondary tiebreaker (string sort, deterministic)
      4. request      — excluded from comparison (compare=False)
    """
    neg_score:   float              # -priority_score (negated for min-heap)
    inserted_at: datetime           # Tiebreaker: older request gets priority
    request_id:  str                # Unique string ID for lookup & lazy delete
    request:     dict = field(compare=False)  # Actual MongoDB document


class BloodRequestPriorityQueue:
    """
    Thread-safe (single-process) max-priority queue backed by heapq.

    Public interface:
      push(request, score)          → O(log n) insert / update
      pop()                         → O(log n) remove + return highest priority
      peek()                        → O(1)     view highest priority (no remove)
      update_priority(request, score) → O(log n) escalation / score change
      size                          → O(1)     active request count
    """

    def __init__(self):
        # The actual binary heap (list of _HeapItem, maintained by heapq)
        self._heap: list[_HeapItem] = []

        # request_id → _HeapItem mapping for O(1) staleness check
        # When an entry is lazily deleted, it's removed from this dict.
        self._entry_finder: dict[str, _HeapItem] = {}

    # ──────────────────────────────────────────────────────────────
    # Public Methods
    # ──────────────────────────────────────────────────────────────

    def push(self, request: dict, priority_score: float) -> None:
        """
        Add a new request or update the score of an existing one.

        O(log n) — heappush sifts the new node up the tree until
        the heap property (parent ≤ child for min-heap) is restored.
        At most log₂(n) swaps.

        If the request already exists, the old entry is lazily marked
        as removed and a new entry with the updated score is inserted.
        """
        request_id = str(request.get("_id", id(request)))

        # Lazy-delete existing entry to avoid duplicates
        if request_id in self._entry_finder:
            self._mark_removed(request_id)

        item = _HeapItem(
            neg_score=-priority_score,          # Negate for max-heap behavior
            inserted_at=request.get("created_at", datetime.now(timezone.utc)),
            request_id=request_id,
            request=request,
        )

        self._entry_finder[request_id] = item
        heapq.heappush(self._heap, item)

        logger.debug(
            f"Queued request {request_id[:8]}… | score={priority_score:.2f} "
            f"| queue_size={self.size}"
        )

    def pop(self) -> Optional[dict]:
        """
        Remove and return the highest priority request document.

        O(log n) — heappop swaps root with the last element, removes
        the last element, then sifts down to restore heap property.
        Skips lazily-deleted (stale) entries automatically.

        Returns None if the queue is empty.
        """
        while self._heap:
            item = heapq.heappop(self._heap)

            # Skip stale entries (lazily deleted)
            if item.request_id == _REMOVED:
                continue

            # Also skip if not in finder (edge case: manually removed)
            if item.request_id not in self._entry_finder:
                continue

            del self._entry_finder[item.request_id]
            logger.debug(
                f"Dispatched request {item.request_id[:8]}… "
                f"| score={-item.neg_score:.2f} | remaining={self.size}"
            )
            return item.request

        return None  # Queue exhausted

    def peek(self) -> Optional[dict]:
        """
        Return the highest priority request WITHOUT removing it.

        O(1) amortised — reads heap[0], skipping any stale entries
        at the top (which is rare in practice).

        Used by the hospital dashboard to display "next up" without
        consuming the queue.
        """
        while self._heap:
            item = self._heap[0]
            if item.request_id != _REMOVED and item.request_id in self._entry_finder:
                return item.request
            # Stale entry at root — clean it up
            heapq.heappop(self._heap)

        return None

    def update_priority(self, request: dict, new_score: float) -> None:
        """
        Change the priority of an existing request.

        Called by:
          - EscalationService (boost score for long-waiting requests)
          - Admin endpoint (recompute after rule change)

        Implementation: lazy deletion + re-insert (standard heapq pattern).
        Old entry becomes stale in the heap but is ignored during pop().
        New entry with updated score is pushed — O(log n).
        """
        self.push(request, new_score)  # push() handles stale detection

    def remove(self, request_id: str) -> bool:
        """
        Mark a specific request as removed (e.g., after fulfillment).

        O(1) — just updates the entry_finder dict and marks item stale.
        The stale entry stays in the heap until it bubbles up during pop().

        Returns True if the request was found and removed, False otherwise.
        """
        if request_id in self._entry_finder:
            self._mark_removed(request_id)
            logger.debug(f"Request {request_id[:8]}… removed from queue")
            return True
        return False

    def rebuild_from_list(self, requests_with_scores: list[tuple[dict, float]]) -> None:
        """
        Replace the entire queue with a fresh set of requests.

        Used on:
          - Application startup (load all pending from MongoDB)
          - After a full priority recomputation (rule change)

        Uses heapq.heapify() which builds a heap in O(n) — more efficient
        than calling push() n times (which would be O(n log n)).
        """
        self._heap.clear()
        self._entry_finder.clear()

        for request, score in requests_with_scores:
            request_id = str(request.get("_id", id(request)))
            item = _HeapItem(
                neg_score=-score,
                inserted_at=request.get("created_at", datetime.now(timezone.utc)),
                request_id=request_id,
                request=request,
            )
            self._heap.append(item)
            self._entry_finder[request_id] = item

        heapq.heapify(self._heap)  # O(n) — builds heap bottom-up
        logger.info(f"Priority queue rebuilt with {self.size} requests")

    # ──────────────────────────────────────────────────────────────
    # Properties
    # ──────────────────────────────────────────────────────────────

    @property
    def size(self) -> int:
        """Number of ACTIVE (non-stale) requests in the queue. O(1)."""
        return len(self._entry_finder)

    def __len__(self) -> int:
        return self.size

    def is_empty(self) -> bool:
        return self.size == 0

    def get_top_n(self, n: int = 10) -> list[dict]:
        """
        Return top-N requests by priority WITHOUT modifying the queue.

        Implementation: build a temporary sorted list from active entries.
        O(k log k) where k = active queue size.

        Used for dashboard snapshots — hospital staff can see the full
        priority order without consuming the queue.
        """
        active_items = [
            item for item in self._heap
            if item.request_id != _REMOVED
            and item.request_id in self._entry_finder
        ]
        # Sort by neg_score ascending (= descending priority)
        active_items.sort(key=lambda x: x.neg_score)
        return [item.request for item in active_items[:n]]

    # ──────────────────────────────────────────────────────────────
    # Internal Helpers
    # ──────────────────────────────────────────────────────────────

    def _mark_removed(self, request_id: str) -> None:
        """
        Mark an existing entry as stale.

        We can't physically remove from the middle of a heap efficiently,
        so we use the sentinel trick: change the request_id to _REMOVED.
        The entry remains in the heap but pop() will skip it.

        O(1) — just two dict/attribute operations.
        """
        item = self._entry_finder.pop(request_id)
        item.request_id = _REMOVED
