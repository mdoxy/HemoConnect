/**
 * evaluateRule.js — Generic Rule Evaluator
 *
 * This is the CORE of the dynamic rules engine.
 * It evaluates a single rule against a blood request object.
 *
 * Supported operators:
 *   equals        → strict equality
 *   not_equals    → strict inequality
 *   less_than     → numeric less-than
 *   greater_than  → numeric greater-than
 *   in            → field value exists in rule.value array
 *   not_in        → field value NOT in rule.value array
 *   contains      → string contains substring (case-insensitive)
 *
 * @param {Object} rule    — a PriorityRule document
 * @param {Object} request — the blood request object being scored
 * @returns {boolean}      — true if the rule condition is satisfied
 */
export function evaluateRule(rule, request) {
  // Support dot-notation for nested fields, e.g. "eligibility.emergency"
  const fieldValue = rule.field
    .split('.')
    .reduce((obj, key) => (obj != null ? obj[key] : undefined), request);

  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  switch (rule.operator) {
    case 'equals':
      // Allow loose comparison for booleans sent as strings
      // eslint-disable-next-line eqeqeq
      return String(fieldValue) === String(rule.value);

    case 'not_equals':
      // eslint-disable-next-line eqeqeq
      return String(fieldValue) !== String(rule.value);

    case 'less_than':
      return Number(fieldValue) < Number(rule.value);

    case 'greater_than':
      return Number(fieldValue) > Number(rule.value);

    case 'in':
      if (!Array.isArray(rule.value)) return false;
      return rule.value.includes(fieldValue);

    case 'not_in':
      if (!Array.isArray(rule.value)) return false;
      return !rule.value.includes(fieldValue);

    case 'contains':
      return String(fieldValue)
        .toLowerCase()
        .includes(String(rule.value).toLowerCase());

    default:
      console.warn(`[RuleEngine] Unknown operator: "${rule.operator}"`);
      return false;
  }
}
