/**
 * Backs up your entire database (ratings + feedback) to local JSON files,
 * timestamped, so you always have a safety copy you can restore from.
 *
 * Usage (from the api/ folder):
 *   node scripts/backup-database.js
 *
 * Output:
 *   api/backups/2026-08-26_ratings.json
 *   api/backups/2026-08-26_feedback.json
 *
 * Run this anytime you want a fresh snapshot — before running any other
 * migration/cleanup script is a great habit, and doing it weekly (or daily)
 * on your own is a good safety net even without automation.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const Feedback = require('../models/Feedback');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Add it to api/.env or export it before running.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected.\n');

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const dateStamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'); // e.g. 2026-08-26-14-32-05

  const collections = [
    { name: 'ratings', model: Rating },
    { name: 'feedback', model: Feedback }
  ];

  for (const { name, model } of collections) {
    const docs = await model.find({}).lean();
    const outPath = path.join(backupDir, `${dateStamp}_${name}.json`);
    fs.writeFileSync(outPath, JSON.stringify(docs, null, 2));
    console.log(`✅ ${name}: ${docs.length} documents -> ${outPath}`);
  }

  console.log('\nBackup complete. Keep this "backups" folder somewhere safe');
  console.log('(e.g. copy it to Google Drive / Dropbox) — it is NOT uploaded to git.');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
