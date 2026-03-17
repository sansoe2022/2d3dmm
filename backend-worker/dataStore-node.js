/**
 * Shared JSON file data store for Myanmar 2D/3D Lottery customers
 * Used by both the Telegram bot and the REST API
 */

const fs = require('fs');
const path = require('path');

// Data directory - configurable via env var
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'customers.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Read all customers from the JSON store
 * @returns {Object} Map of sessionKey -> CustomerRecord[]
 */
function readAllData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DataStore] Error reading data file:', err.message);
    return {};
  }
}

/**
 * Write all data back to the JSON store
 * @param {Object} data
 */
function writeAllData(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DataStore] Error writing data file:', err.message);
    throw err;
  }
}

/**
 * Get session key from date and session
 * @param {Date|string} date
 * @param {'morning'|'evening'} session
 * @returns {string}
 */
function getSessionKey(date, session) {
  const d = date instanceof Date ? date : new Date(date);
  const dateStr = d.toISOString().split('T')[0];
  return `${dateStr}-${session}`;
}

/**
 * Get all customers for a specific session
 * @param {string} sessionKey
 * @returns {Array}
 */
function getCustomersForSession(sessionKey) {
  const data = readAllData();
  return data[sessionKey] || [];
}

/**
 * Add a customer to a session
 * @param {Object} customer
 * @param {string} sessionKey
 * @returns {Object} The saved customer
 */
function addCustomer(customer, sessionKey) {
  const data = readAllData();
  if (!data[sessionKey]) {
    data[sessionKey] = [];
  }

  const newCustomer = {
    ...customer,
    id: customer.id || `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: customer.createdAt || new Date().toISOString(),
    source: customer.source || 'telegram',
  };

  data[sessionKey].push(newCustomer);
  writeAllData(data);
  return newCustomer;
}

/**
 * Update a customer in a session
 * @param {string} customerId
 * @param {Object} updates
 * @param {string} sessionKey
 * @returns {Object|null}
 */
function updateCustomer(customerId, updates, sessionKey) {
  const data = readAllData();
  if (!data[sessionKey]) return null;

  const index = data[sessionKey].findIndex(c => c.id === customerId);
  if (index === -1) return null;

  data[sessionKey][index] = {
    ...data[sessionKey][index],
    ...updates,
    id: customerId, // preserve id
    updatedAt: new Date().toISOString(),
  };

  writeAllData(data);
  return data[sessionKey][index];
}

/**
 * Delete a customer from a session
 * @param {string} customerId
 * @param {string} sessionKey
 * @returns {boolean}
 */
function deleteCustomer(customerId, sessionKey) {
  const data = readAllData();
  if (!data[sessionKey]) return false;

  const before = data[sessionKey].length;
  data[sessionKey] = data[sessionKey].filter(c => c.id !== customerId);

  if (data[sessionKey].length === before) return false;

  writeAllData(data);
  return true;
}

/**
 * Find a customer by Telegram user ID in a session (to avoid duplicates from same user)
 * @param {number} telegramUserId
 * @param {string} sessionKey
 * @returns {Object|null}
 */
function findCustomerByTelegramId(telegramUserId, sessionKey) {
  const customers = getCustomersForSession(sessionKey);
  return customers.find(c => c.telegramUserId === telegramUserId) || null;
}

module.exports = {
  getSessionKey,
  getCustomersForSession,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  findCustomerByTelegramId,
};
