/**
 * seedPriorityRules.js — Default Priority Rules Seeder
 *
 * Run once to populate MongoDB with default scoring rules.
 * Safe to re-run: clears old rules and inserts fresh ones.
 *
 * Usage:
 *   node scripts/seedPriorityRules.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];
envPaths.forEach((p) => { if (fs.existsSync(p)) dotenv.config({ path: p, override: false }); });

import PriorityRule from '../models/PriorityRule.js';

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT RULES
// Modify scores here or via the admin API at runtime — no code change needed.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_RULES = [
  // ── Emergency / Urgency ─────────────────────────────────────────────────
  {
    ruleName: 'Emergency Case',
    description: 'Request flagged as an emergency by the requester',
    field: 'emergency',
    operator: 'equals',
    value: 'true',
    score: 50,
    enabled: true,
    priority: 1,
  },
  {
    ruleName: 'Critical Time — Under 2 Hours',
    description: 'Blood needed within 2 hours',
    field: 'hoursLeft',
    operator: 'less_than',
    value: 2,
    score: 40,
    enabled: true,
    priority: 2,
  },
  {
    ruleName: 'Urgent Time — Under 6 Hours',
    description: 'Blood needed within 6 hours',
    field: 'hoursLeft',
    operator: 'less_than',
    value: 6,
    score: 20,
    enabled: true,
    priority: 3,
  },

  // ── Blood Group Rarity ──────────────────────────────────────────────────
  {
    ruleName: 'Rare Blood Group',
    description: 'O- and AB- are the rarest blood groups',
    field: 'bloodGroup',
    operator: 'in',
    value: ['O-', 'AB-'],
    score: 25,
    enabled: true,
    priority: 4,
  },
  {
    ruleName: 'Uncommon Blood Group',
    description: 'B- and A- are less common',
    field: 'bloodGroup',
    operator: 'in',
    value: ['B-', 'A-'],
    score: 15,
    enabled: true,
    priority: 5,
  },

  // ── High Units Required ──────────────────────────────────────────────────
  {
    ruleName: 'High Volume Request — 5+ Units',
    description: 'Large blood volume needed indicates severe condition',
    field: 'unitsRequired',
    operator: 'greater_than',
    value: 4,
    score: 20,
    enabled: true,
    priority: 6,
  },
  {
    ruleName: 'Moderate Volume Request — 3+ Units',
    description: 'Moderate blood volume needed',
    field: 'unitsRequired',
    operator: 'greater_than',
    value: 2,
    score: 10,
    enabled: true,
    priority: 7,
  },

  // ── Reason Keywords ──────────────────────────────────────────────────────
  {
    ruleName: 'Surgery Reason',
    description: 'Request reason mentions surgery',
    field: 'reason',
    operator: 'contains',
    value: 'surgery',
    score: 15,
    enabled: true,
    priority: 8,
  },
  {
    ruleName: 'Accident Reason',
    description: 'Request reason mentions accident or trauma',
    field: 'reason',
    operator: 'contains',
    value: 'accident',
    score: 20,
    enabled: true,
    priority: 9,
  },
  {
    ruleName: 'Cancer Treatment',
    description: 'Request reason mentions cancer or chemotherapy',
    field: 'reason',
    operator: 'contains',
    value: 'cancer',
    score: 18,
    enabled: true,
    priority: 10,
  },
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('❌  MONGODB_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅  Connected to MongoDB');

    // Clear existing rules
    const deleted = await PriorityRule.deleteMany({});
    console.log(`🗑️   Cleared ${deleted.deletedCount} existing rules`);

    // Insert defaults
    const inserted = await PriorityRule.insertMany(DEFAULT_RULES);
    console.log(`✅  Inserted ${inserted.length} priority rules:`);
    inserted.forEach((r) => console.log(`    [${r.priority}] ${r.ruleName} → +${r.score} pts`));

    await mongoose.disconnect();
    console.log('✅  Done. Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
