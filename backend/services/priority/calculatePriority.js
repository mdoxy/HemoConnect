import PriorityRule from '../../models/PriorityRule.js';
import { evaluateRule } from './evaluateRule.js';

/**
 * calculatePriority — Rule-Based Scoring Engine
 *
 * Fetches all enabled rules from MongoDB, evaluates each against the
 * incoming blood request, and sums the scores.
 *
 * This is intentionally DB-driven so admins can tune weights at runtime
 * without any backend code changes.
 *
 * @param {Object} requestData — plain object representing the blood request fields
 * @returns {Promise<number>}  — total priority score
 */
export async function calculatePriority(requestData) {
  try {
    // Fetch all active rules, sorted by evaluation priority order
    const rules = await PriorityRule.find({ enabled: true }).sort({ priority: 1 });

    if (rules.length === 0) {
      console.warn('[PriorityEngine] No enabled rules found. Score will be 0.');
      return 0;
    }

    let totalScore = 0;
    const matchedRules = [];

    rules.forEach((rule) => {
      if (evaluateRule(rule, requestData)) {
        totalScore += rule.score;
        matchedRules.push({ ruleName: rule.ruleName, scoreAdded: rule.score });
      }
    });

    console.log(
      `[PriorityEngine] Score: ${totalScore} | Rules matched:`,
      matchedRules.length > 0 ? matchedRules : 'none'
    );

    return totalScore;
  } catch (error) {
    console.error('[PriorityEngine] Error calculating priority score:', error.message);
    // Return 0 on failure — requests still get saved, just with no priority score
    return 0;
  }
}
