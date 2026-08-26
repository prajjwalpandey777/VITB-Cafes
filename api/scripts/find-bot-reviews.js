/**
 * Finds (and optionally deletes) ratings whose "name" field matches
 * common automated-test/bot naming patterns, e.g.:
 *   DripBot_20, TestUser_2, Bot_5, LoadTest_11, etc.
 *
 * These are real dishes with fake bot-submitted reviews — different from
 * find-orphaned-ratings.js, which only catches fake DISHES. This script
 * catches fake REVIEWERS on otherwise-real dishes.
 *
 * SAFE BY DEFAULT: dry-run unless you pass --apply.
 *
 * Usage (from the api/ folder):
 *   node scripts/find-bot-reviews.js              # dry run — lists what's found
 *   node scripts/find-bot-reviews.js --apply       # actually deletes them
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Rating = require('../models/Rating');

const APPLY = process.argv.includes('--apply');

// Add more patterns here anytime you spot a new bot naming style.
const BOT_NAME_PATTERNS = [
  /^dripbot[_\s]?\d*$/i,
  /^testuser[_\s]?\d*$/i,
  /^bot[_\s]?\d*$/i,
  /^loadtest[_\s]?\d*$/i,
  /^stresstest[_\s]?\d*$/i,
  /^automated[_\s]?test/i,
  /^qa[_\s]?bot[_\s]?\d*$/i
];

// Also flag review TEXT that looks machine-generated (sequential IDs,
// embedded ISO timestamps — real students don't write reviews like this).
const BOT_REVIEW_TEXT_PATTERNS = [
  /#\d+\s*-\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i, // "#20 - 2026-8-24T16:55:48..."
  /^automated test review/i,
  /^drip review/i
];

function isBotName(name) {
  return BOT_NAME_PATTERNS.some(p => p.test(name || ''));
}

function isBotReviewText(text) {
  return BOT_REVIEW_TEXT_PATTERNS.some(p => p.test(text || ''));
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Add it to api/.env or export it before running.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB... (${APPLY ? 'APPLY MODE — will DELETE' : 'DRY RUN — nothing will be deleted'})`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected.\n');

  const all = await Rating.find({}).lean();
  console.log(`Scanned ${all.length} total rating documents.\n`);

  const flagged = all.filter(r => isBotName(r.name) || isBotReviewText(r.review));

  if (flagged.length === 0) {
    console.log('✅ No bot-pattern reviews found.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${flagged.length} bot-pattern review(s):\n`);
  flagged.forEach(r => {
    console.log(`  [${r.cafeId}] "${r.itemName}"  |  name: "${r.name}"  |  review: "${(r.review || '').slice(0, 60)}"`);
  });

  if (!APPLY) {
    console.log(`\nThis was a DRY RUN. Nothing was deleted.`);
    console.log(`Review the list above — if it all looks like bot junk, re-run with --apply:`);
    console.log(`  node scripts/find-bot-reviews.js --apply`);
  } else {
    const ids = flagged.map(r => r._id);
    const result = await Rating.deleteMany({ _id: { $in: ids } });
    console.log(`\n🗑️  Deleted ${result.deletedCount} bot-pattern reviews.`);
    console.log(`Note: this only removes the fake reviews — it does NOT delete the real dishes themselves.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
