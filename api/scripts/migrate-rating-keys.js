/**
 * One-time migration: re-derive itemKey on every existing Rating document
 * from its stored itemName, using the CANONICAL slugifier (makeItemKey).
 *
 * This fixes ratings that were saved under a slightly different key than
 * what the frontend now looks them up under (e.g. trailing-underscore
 * mismatch for dish names ending in ')', '!', etc.)
 *
 * SAFE BY DEFAULT: runs in --dry-run mode unless you pass --apply.
 *
 * Usage (from the api/ folder):
 *   node scripts/migrate-rating-keys.js            # dry run, just prints what WOULD change
 *   node scripts/migrate-rating-keys.js --apply     # actually writes the fix to MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const { makeItemKey } = require('../utils/text');

const APPLY = process.argv.includes('--apply');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Add it to api/.env or export it before running.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB... (${APPLY ? 'APPLY MODE — will write changes' : 'DRY RUN — no changes will be saved'})`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected.\n');

  const all = await Rating.find({}).lean(false); // lean(false) = get real documents we can .save()
  console.log(`Found ${all.length} total rating documents.\n`);

  let mismatched = 0;
  const preview = [];

  for (const r of all) {
    const correctKey = makeItemKey(r.itemName);
    if (r.itemKey !== correctKey) {
      mismatched++;
      preview.push({
        id: r._id.toString(),
        itemName: r.itemName,
        oldKey: r.itemKey,
        newKey: correctKey
      });

      if (APPLY) {
        r.itemKey = correctKey;
        await r.save();
      }
    }
  }

  console.log(`Mismatched documents found: ${mismatched}\n`);

  // Show up to 20 examples either way
  preview.slice(0, 20).forEach(p => {
    console.log(`  "${p.itemName}"  |  old: ${p.oldKey}  ->  new: ${p.newKey}`);
  });
  if (preview.length > 20) console.log(`  ...and ${preview.length - 20} more`);

  if (!APPLY && mismatched > 0) {
    console.log(`\nThis was a DRY RUN. Nothing was changed.`);
    console.log(`Re-run with --apply to actually fix these ${mismatched} documents:`);
    console.log(`  node scripts/migrate-rating-keys.js --apply`);
  } else if (APPLY) {
    console.log(`\n✅ Fixed ${mismatched} documents in MongoDB.`);
  } else {
    console.log(`\n✅ Nothing to fix — all itemKeys already match their canonical slug.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
