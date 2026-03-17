/**
 * Myanmar 2D/3D Lottery - Telegram Bot + REST API Server
 *
 * Runs a Telegram bot that accepts betting lists via DM and saves them
 * to a shared JSON data store. Also exposes REST API endpoints for the
 * web frontend to read, update, and delete customer records.
 *
 * Usage:
 *   node bot/server.js
 *   # or with env vars:
 *   BOT_TOKEN=xxx PORT=4000 DATA_DIR=./data node bot/server.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const { parseBettingText, formatAmount } = require('./bettingParser');
const {
  getSessionKey,
  getCustomersForSession,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  findCustomerByTelegramId,
} = require('./dataStore');

// ─── Configuration ────────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN || '8702735120:AAHE8Ulh4B9iduuoYR3i204YF4L73JwFgZE';
const PORT = parseInt(process.env.PORT || '4000', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ─── Helper: Detect session from time ────────────────────────────────────────
function detectSession(date = new Date()) {
  return date.getHours() < 12 ? 'morning' : 'evening';
}

// ─── Helper: Format Myanmar confirmation message ──────────────────────────────
function formatConfirmationMessage(customerName, entries, totalAmount, bettingType, session, date) {
  const sessionLabel = session === 'morning' ? 'မနက်' : 'ညနေ';
  const dateStr = new Date(date).toLocaleDateString('my-MM', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let msg = `✅ *${customerName}* ၏ လောင်းကြေးများ မှတ်တမ်းတင်ပြီးပါပြီ\n\n`;
  msg += `📅 ${dateStr} | ⏰ ${sessionLabel} | 🎯 ${bettingType}\n`;
  msg += `${'─'.repeat(28)}\n`;

  entries.forEach(entry => {
    msg += `  *${entry.number}*  →  ${formatAmount(entry.amount)} ကျပ်\n`;
  });

  msg += `${'─'.repeat(28)}\n`;
  msg += `💰 *စုစုပေါင်း: ${formatAmount(totalAmount)} ကျပ်*\n\n`;
  msg += `_ကျေးဇူးတင်ပါသည်_ 🙏`;

  return msg;
}

// ─── Helper: Detect betting type from text ────────────────────────────────────
function detectBettingType(text) {
  // Check if any line starts with a 3-digit number
  const lines = text.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d{3}\s+\d/.test(trimmed) || /^\d{3}-\d/.test(trimmed)) {
      return '3D';
    }
  }
  return '2D';
}

// ─── Telegram Bot ─────────────────────────────────────────────────────────────
console.log('[Bot] Initializing Telegram bot...');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on('polling_error', (err) => {
  console.error('[Bot] Polling error:', err.message);
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const name = msg.from?.first_name || msg.from?.username || 'Customer';
  const reply =
    `မင်္ဂလာပါ *${name}* 🎯\n\n` +
    `Myanmar 2D/3D Lottery Bot မှ ကြိုဆိုပါသည်။\n\n` +
    `*2D ထိုးနည်း:*\n` +
    `\`12 500\`\n` +
    `\`34 1000R\` (ပြောင်းပြန်)\n` +
    `\`56 300\`\n\n` +
    `*3D ထိုးနည်း:*\n` +
    `\`123 500\`\n` +
    `\`456 1000R\` (ပြောင်းပြန်)\n\n` +
    `လောင်းကြေးစာရင်းကို ဤပုံစံဖြင့် ပေးပို့ပါ။`;

  bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const reply =
    `*အကူအညီ* 📖\n\n` +
    `*2D ထိုးနည်း:*\n` +
    `\`နံပါတ် ငွေပမာဏ\`\n` +
    `ဥပမာ - \`12 500\`\n` +
    `ပြောင်းပြန် - \`12 1000R\` (12 နှင့် 21 နှစ်ခုလုံး)\n\n` +
    `*3D ထိုးနည်း:*\n` +
    `\`နံပါတ် ငွေပမာဏ\`\n` +
    `ဥပမာ - \`123 500\`\n` +
    `ပြောင်းပြန် - \`123 1000R\` (ပြောင်းလဲမှုများအားလုံး)\n\n` +
    `*မှတ်ချက်:*\n` +
    `• မနက် ၁၂ နာရီမတိုင်မီ = မနက်ပိုင်း\n` +
    `• မနက် ၁၂ နာရီနောက် = ညနေပိုင်း`;

  bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
});

// Handle /status command - show today's bets for this user
bot.onText(/\/status/, async (msg) => {
  const now = new Date();
  const session = detectSession(now);
  const sessionKey = getSessionKey(now, session);
  const telegramUserId = msg.from?.id;

  const existing = findCustomerByTelegramId(telegramUserId, sessionKey);

  if (!existing) {
    bot.sendMessage(
      msg.chat.id,
      `ယနေ့ ${session === 'morning' ? 'မနက်' : 'ညနေ'}ပိုင်းအတွက် လောင်းကြေးမှတ်တမ်းမရှိသေးပါ။`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const entries = Array.isArray(existing.bettingData) ? existing.bettingData : [];
  const msg2 = formatConfirmationMessage(
    existing.name,
    entries,
    existing.totalBet,
    existing.bettingType,
    session,
    now
  );
  bot.sendMessage(msg.chat.id, msg2, { parse_mode: 'Markdown' });
});

// Handle betting text messages
bot.on('message', async (msg) => {
  // Skip commands
  if (!msg.text || msg.text.startsWith('/')) return;
  // Only handle private messages
  if (msg.chat.type !== 'private') return;

  const chatId = msg.chat.id;
  const telegramUserId = msg.from?.id;
  const customerName = msg.from?.first_name || msg.from?.username || `User_${telegramUserId}`;
  const text = msg.text.trim();

  // Detect betting type from the text
  const bettingType = detectBettingType(text);

  // Parse the betting text
  const parsed = parseBettingText(text, bettingType);

  if (parsed.entries.length === 0) {
    const errorMsg =
      `❌ လောင်းကြေးစာရင်း မမှန်ကန်ပါ။\n\n` +
      `*မှန်ကန်သောပုံစံ (2D):*\n\`12 500\`\n\`34 1000R\`\n\n` +
      `*မှန်ကန်သောပုံစံ (3D):*\n\`123 500\`\n\`456 1000R\`\n\n` +
      (parsed.errors.length > 0 ? `*အမှားများ:*\n${parsed.errors.slice(0, 3).join('\n')}` : '');

    bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
    return;
  }

  // Detect session from current time
  const now = new Date();
  const session = detectSession(now);
  const sessionKey = getSessionKey(now, session);

  // Check if this user already has a record for this session
  const existing = findCustomerByTelegramId(telegramUserId, sessionKey);

  let savedCustomer;

  if (existing) {
    // Update existing record
    savedCustomer = updateCustomer(existing.id, {
      bettingData: parsed.entries,
      totalBet: parsed.totalAmount,
      bettingType,
      date: now.toISOString(),
    }, sessionKey);

    console.log(`[Bot] Updated customer: ${customerName} (${telegramUserId}) for session ${sessionKey}`);
  } else {
    // Create new customer record
    const customerRecord = {
      name: customerName,
      telegramUserId,
      telegramChatId: chatId,
      bettingData: parsed.entries,
      totalBet: parsed.totalAmount,
      bettingType,
      paymentType: 'cash',
      weeklySettle: false,
      session,
      date: now.toISOString(),
      source: 'telegram',
    };

    savedCustomer = addCustomer(customerRecord, sessionKey);
    console.log(`[Bot] Added new customer: ${customerName} (${telegramUserId}) for session ${sessionKey}`);
  }

  // Send confirmation
  const confirmMsg = formatConfirmationMessage(
    customerName,
    parsed.entries,
    parsed.totalAmount,
    bettingType,
    session,
    now
  );

  if (parsed.errors.length > 0) {
    const warningMsg = `\n\n⚠️ *ကျော်လွန်ခဲ့သောစာကြောင်းများ:*\n${parsed.errors.slice(0, 3).join('\n')}`;
    bot.sendMessage(chatId, confirmMsg + warningMsg, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, confirmMsg, { parse_mode: 'Markdown' });
  }
});

// ─── REST API Endpoints ───────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/customers?date=YYYY-MM-DD&session=morning|evening
app.get('/api/customers', (req, res) => {
  try {
    const { date, session } = req.query;

    if (!date || !session) {
      return res.status(400).json({
        error: 'Missing required query params: date (YYYY-MM-DD) and session (morning|evening)',
      });
    }

    if (!['morning', 'evening'].includes(session)) {
      return res.status(400).json({ error: 'session must be "morning" or "evening"' });
    }

    const dateObj = new Date(date + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const sessionKey = getSessionKey(dateObj, session);
    const customers = getCustomersForSession(sessionKey);

    res.json({ customers, sessionKey, count: customers.length });
  } catch (err) {
    console.error('[API] GET /api/customers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/customers - Add a customer from web app
app.post('/api/customers', (req, res) => {
  try {
    const { customer, date, session } = req.body;

    if (!customer || !date || !session) {
      return res.status(400).json({ error: 'Missing required fields: customer, date, session' });
    }

    const dateObj = new Date(date + 'T00:00:00');
    const sessionKey = getSessionKey(dateObj, session);
    const saved = addCustomer({ ...customer, source: 'web' }, sessionKey);

    res.status(201).json({ customer: saved, sessionKey });
  } catch (err) {
    console.error('[API] POST /api/customers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/customers/:id - Update a customer
app.put('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { updates, date, session } = req.body;

    if (!updates || !date || !session) {
      return res.status(400).json({ error: 'Missing required fields: updates, date, session' });
    }

    const dateObj = new Date(date + 'T00:00:00');
    const sessionKey = getSessionKey(dateObj, session);
    const updated = updateCustomer(id, updates, sessionKey);

    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer: updated });
  } catch (err) {
    console.error('[API] PUT /api/customers/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/customers/:id?date=YYYY-MM-DD&session=morning|evening
app.delete('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, session } = req.query;

    if (!date || !session) {
      return res.status(400).json({ error: 'Missing required query params: date, session' });
    }

    const dateObj = new Date(date + 'T00:00:00');
    const sessionKey = getSessionKey(dateObj, session);
    const deleted = deleteCustomer(id, sessionKey);

    if (!deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('[API] DELETE /api/customers/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] REST API listening on http://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  console.log(`[Server] Customers API: http://localhost:${PORT}/api/customers?date=YYYY-MM-DD&session=morning`);
  console.log(`[Bot] Telegram bot is running (polling mode)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down...');
  bot.stopPolling();
  process.exit(0);
});
