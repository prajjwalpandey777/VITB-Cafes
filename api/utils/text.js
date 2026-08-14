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

module.exports = { cleanText, makeItemKey, escapeHtml };
