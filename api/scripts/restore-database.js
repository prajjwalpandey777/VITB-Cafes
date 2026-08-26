/**
 * Restores a collection from a backup JSON file created by backup-database.js.
 *
 * ⚠️ USE WITH CARE — this INSERTS the backed-up documents. It does NOT
 * delete anything currently in the collection first (safer default — no
 * accidental data loss). If you specifically want to wipe and replace,
 * pass --wipe (see below).
 *
 * Usage (from the api/ folder):
 *   node scripts/restore-database.js ratings backups/2026-08-26-14-32-05_ratings.json
 *   node scripts/restore-database.js feedback backups/2026-08-26-14-32-05_feedback.json
 *
 * To wipe the collection first (DANGEROUS — deletes everything currently
 * there before restoring):
 *   node scripts/restore-database.js ratings backups/2026-08-26-14-32-05_ratings.json --wipe
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const Feedback = require('../models/Feedback');

const MODELS = { ratings: Rating, feedback: Feedback };

async function main() {
  const [, , collectionName, filePath] = process.argv;
  const WIPE = process.argv.includes('--wipe');

  if (!collectionName || !filePath || !MODELS[collectionName]) {
    console.error('Usage: node scripts/restore-database.js <ratings|feedback> <path-to-backup.json> [--wipe]');
    process.exit(1);
  }

  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Add it to api/.env or export it before running.');
    process.exit(1);
  }

  const docs = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  console.log(`Loaded ${docs.length} documents from ${fullPath}\n`);

  console.log(`Connecting to MongoDB... (${WIPE ? '⚠️  WIPE MODE — existing data will be deleted first' : 'safe mode — only inserting'})`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected.\n');

  const Model = MODELS[collectionName];

  if (WIPE) {
    const existing = await Model.countDocuments();
    console.log(`Deleting ${existing} existing documents from "${collectionName}"...`);
    await Model.deleteMany({});
  }

  // Strip _id so Mongo assigns fresh ones and avoids duplicate-key errors
  // when not wiping first.
  const cleanDocs = docs.map(({ _id, __v, ...rest }) => rest);

  let inserted = 0;
  for (const doc of cleanDocs) {
    try {
      await Model.create(doc);
      inserted++;
    } catch (err) {
      console.error(`  Skipped one document due to error: ${err.message}`);
    }
  }

  console.log(`\n✅ Restored ${inserted}/${docs.length} documents into "${collectionName}".`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Restore failed:', err);
  process.exit(1);
});
