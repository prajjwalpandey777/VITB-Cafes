function cleanText(value, maxLength, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const normalized = value
    .replace(/[<>]/g, '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
  return normalized || fallback;
}

function makeItemKey(itemName) {
  return itemName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ══════════════════════════════════════
   BASIC REVIEW CONTENT SAFETY
   Lightweight, self-contained checks — not a full moderation system,
   just catches the obvious/common abuse patterns before they hit the DB.
══════════════════════════════════════ */

// Small built-in list — case-insensitive, whole-word matching only
// (so e.g. "class" won't falsely match "ass"). Extend this list anytime.
const BLOCKED_WORDS = [
  'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'bastard', 'asshole',
  'bhosdi', 'bhosdike', 'chutiya', 'madarchod', 'behenchod', 'bhenchod',
  'randi', 'gandu', 'lund', 'chod', 'harami'
];

function containsBlockedWords(text) {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lower));
}

function containsSpamLink(text) {
  return /(https?:\/\/|www\.)\S+/i.test(text);
}

function containsCharacterSpam(text) {
  // Same character repeated 6+ times in a row, e.g. "aaaaaaa" or "!!!!!!!"
  return /(.)\1{5,}/.test(text);
}

function isExcessiveCaps(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 12) return false; // too short to judge fairly
  const upperCount = (letters.match(/[A-Z]/g) || []).length;
  return upperCount / letters.length > 0.8; // more than 80% caps
}

// Known automated-test/bot naming and review-text patterns — the exact
// signatures seen from real bot traffic hitting this site directly
// (e.g. "DripBot_20", "TestUser_2", "Drip review #20 - <ISO timestamp>").
// Add new patterns here anytime a new bot signature shows up.
const BOT_NAME_PATTERNS = [
  /^dripbot[_\s]?\d*$/i,
  /^testuser[_\s]?\d*$/i,
  /^bot[_\s]?\d*$/i,
  /^loadtest[_\s]?\d*$/i,
  /^stresstest[_\s]?\d*$/i,
  /^automated[_\s]?test/i,
  /^qa[_\s]?bot[_\s]?\d*$/i
];

const BOT_REVIEW_TEXT_PATTERNS = [
  /#\d+\s*-\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i, // "#20 - 2026-8-24T16:55:48..."
  /^automated test review/i,
  /^drip review/i
];

function isBotLikeName(name) {
  return BOT_NAME_PATTERNS.some(p => p.test(name || ''));
}

function isBotLikeReviewText(text) {
  return BOT_REVIEW_TEXT_PATTERNS.some(p => p.test(text || ''));
}

/**
 * Validates review text for basic safety issues.
 * Returns null if the text is fine, or a short user-facing error string
 * if it should be rejected.
 */
function validateReviewText(text) {
  if (!text) return null; // empty review is always allowed
  if (containsSpamLink(text)) return 'Reviews cannot contain links.';
  if (containsBlockedWords(text)) return 'Please keep your review respectful — inappropriate language was detected.';
  if (containsCharacterSpam(text)) return 'Please write a genuine review instead of repeated characters.';
  if (isExcessiveCaps(text)) return 'Please avoid writing your entire review in capital letters.';
  if (isBotLikeReviewText(text)) return 'This review looks automated and cannot be submitted.';
  return null;
}

module.exports = { cleanText, makeItemKey, escapeHtml, validateReviewText, isBotLikeName };
