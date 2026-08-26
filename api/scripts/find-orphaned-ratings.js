/**
 * Finds Rating documents whose (cafeId + itemKey) doesn't match ANY item
 * currently in your CAFES array in index.html — i.e. dishes that were
 * renamed or removed from the menu, with no current dish to attach to.
 *
 * ⚠️ RUN THE KEY-MISMATCH MIGRATION FIRST (migrate-rating-keys.js --apply).
 * Otherwise this script will also flag the 38 "trailing underscore" dishes
 * as orphaned, when they're actually recoverable, not dead.
 *
 * SAFE BY DEFAULT: dry-run unless you pass --apply.
 *
 * Usage (from the api/ folder):
 *   node scripts/find-orphaned-ratings.js              # dry run — lists what's orphaned
 *   node scripts/find-orphaned-ratings.js --apply       # actually deletes them
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const { makeItemKey } = require('../utils/text');

const APPLY = process.argv.includes('--apply');
const INDEX_HTML_PATH = path.join(__dirname, '..', '..', 'index.html');

function loadCafesFromIndexHtml() {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  const start = html.indexOf('const CAFES=[');
  if (start === -1) throw new Error('Could not find "const CAFES=[" in index.html');
  const end = html.indexOf('\n];', start);
  if (end === -1) throw new Error('Could not find end of CAFES array in index.html');

  const snippet = html.slice(start, end + 3); // includes "const CAFES=[ ... ];"
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(snippet + '\nthis.__CAFES__ = CAFES;', sandbox);
  return sandbox.__CAFES__;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Add it to api/.env or export it before running.');
    process.exit(1);
  }

  console.log('Reading CAFES data from index.html...');
  const CAFES = loadCafesFromIndexHtml();
  const validKeys = new Set();
  for (const cafe of CAFES) {
    for (const item of cafe.items) {
      validKeys.add(`${cafe.id}__${makeItemKey(item.name)}`);
    }
  }
  console.log(`Found ${validKeys.size} valid (cafeId, itemKey) pairs currently on the menu.\n`);

  console.log(`Connecting to MongoDB... (${APPLY ? 'APPLY MODE — will DELETE' : 'DRY RUN — nothing will be deleted'})`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected.\n');

  const all = await Rating.find({}).lean();
  console.log(`Found ${all.length} total rating documents.\n`);

  const orphaned = all.filter(r => !validKeys.has(`${r.cafeId}__${r.itemKey}`));

  if (orphaned.length === 0) {
    console.log('✅ No orphaned ratings found. Nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Group orphaned ratings by (cafeId, itemKey, itemName) so you can review what's about to go
  const groups = {};
  for (const r of orphaned) {
    const g = `${r.cafeId}__${r.itemKey}`;
    if (!groups[g]) groups[g] = { cafeId: r.cafeId, itemKey: r.itemKey, itemName: r.itemName, count: 0 };
    groups[g].count++;
  }

  console.log(`Orphaned rating documents: ${orphaned.length} (across ${Object.keys(groups).length} distinct old dishes)\n`);
  Object.values(groups)
    .sort((a, b) => b.count - a.count)
    .forEach(g => console.log(`  [${g.cafeId}] "${g.itemName}"  (key: ${g.itemKey})  →  ${g.count} rating(s)`));

  if (!APPLY) {
    console.log(`\nThis was a DRY RUN. Nothing was deleted.`);
    console.log(`Review the list above carefully — if any of these are dishes you`);
    console.log(`renamed (not removed), fix the rename instead of deleting.`);
    console.log(`\nRe-run with --apply to permanently delete these ${orphaned.length} documents:`);
    console.log(`  node scripts/find-orphaned-ratings.js --apply`);
  } else {
    const ids = orphaned.map(r => r._id);
    const result = await Rating.deleteMany({ _id: { $in: ids } });
    console.log(`\n🗑️  Deleted ${result.deletedCount} orphaned rating documents.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
