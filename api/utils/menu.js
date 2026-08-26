/**
 * Loads the real menu (cafeId + itemKey pairs) directly from the project's
 * index.html, so the backend can validate that a submitted rating actually
 * corresponds to a real dish — instead of accepting any cafeId/itemName
 * a request happens to send.
 *
 * Cached in memory after first load (menu rarely changes; redeploys /
 * server restarts naturally refresh it). Call refreshMenu() manually if
 * you ever need to force a reload without restarting the server.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { makeItemKey } = require('./text');

// index.html lives at the project root, one level above the api/ folder.
const INDEX_HTML_PATH = path.join(__dirname, '..', '..', 'index.html');

let cachedMenu = null; // { validCafeIds: Set<string>, validKeys: Set<string> }

function loadCafesFromIndexHtml() {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  const start = html.indexOf('const CAFES=[');
  if (start === -1) throw new Error('Could not find "const CAFES=[" in index.html');
  const end = html.indexOf('\n];', start);
  if (end === -1) throw new Error('Could not find end of CAFES array in index.html');

  const snippet = html.slice(start, end + 3);
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(snippet + '\nthis.__CAFES__ = CAFES;', sandbox);
  return sandbox.__CAFES__;
}

function buildMenuIndex() {
  const CAFES = loadCafesFromIndexHtml();
  const validCafeIds = new Set();
  const validKeys = new Set();

  for (const cafe of CAFES) {
    validCafeIds.add(cafe.id);
    for (const item of cafe.items) {
      validKeys.add(`${cafe.id}__${makeItemKey(item.name)}`);
    }
  }

  return { validCafeIds, validKeys };
}

function refreshMenu() {
  cachedMenu = buildMenuIndex();
  return cachedMenu;
}

function getMenu() {
  if (!cachedMenu) refreshMenu();
  return cachedMenu;
}

/**
 * Returns true if the given cafeId + itemName combination is a real,
 * currently-listed menu item.
 */
function isRealMenuItem(cafeId, itemName) {
  const { validCafeIds, validKeys } = getMenu();
  if (!validCafeIds.has(cafeId)) return false;
  const key = `${cafeId}__${makeItemKey(itemName)}`;
  return validKeys.has(key);
}

module.exports = { isRealMenuItem, refreshMenu, getMenu };
