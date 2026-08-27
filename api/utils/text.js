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
  return /(.)\1{5,}/.test(text);
}

function isExcessiveCaps(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 12) return false;
  const upperCount = (letters.match(/[A-Z]/g) || []).length;
  return upperCount / letters.length > 0.8;
}

function validateReviewText(text) {
  if (!text) return null;
  if (containsSpamLink(text)) return 'Reviews cannot contain links.';
  if (containsBlockedWords(text)) return 'Please keep your review respectful — inappropriate language was detected.';
  if (containsCharacterSpam(text)) return 'Please write a genuine review instead of repeated characters.';
  if (isExcessiveCaps(text)) return 'Please avoid writing your entire review in capital letters.';
  return null;
}

module.exports = { cleanText, makeItemKey, escapeHtml, validateReviewText };
