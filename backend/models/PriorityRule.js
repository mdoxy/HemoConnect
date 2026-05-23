import mongoose from 'mongoose';

/**
 * PriorityRule — each document defines one scoring rule.
 * Admins/hospitals can CRUD these rules without touching backend code.
 *
 * field     → which field of the blood-request to inspect
 * operator  → equals | not_equals | less_than | greater_than | in | not_in | contains
 * value     → the comparison target (can be primitive or array)
 * score     → points added when rule matches
 * enabled   → toggle a rule on/off without deleting it
 * priority  → evaluation order (lower number = evaluated first)
 */
const PriorityRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    field: {
      type: String,
      required: true,
    },
    operator: {
      type: String,
      required: true,
      enum: ['equals', 'not_equals', 'less_than', 'greater_than', 'in', 'not_in', 'contains'],
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PriorityRule', PriorityRuleSchema);
