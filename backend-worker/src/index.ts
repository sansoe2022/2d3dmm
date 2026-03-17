import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseBettingText, formatAmount } from './bettingParser';
import {
  getSessionKey,
  getCustomersForSession,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  findCustomerByTelegramId,
  CustomerRecord
} from './dataStore';

type Bindings = {
  LOTTERY_KV: KVNamespace;
  BOT_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// ─── Helper: Detect session from time ────────────────────────────────────────
function detectSession(date = new Date()) {
  return date.getHours() < 12 ? 'morning' : 'evening';
}

// ─── Helper: Format Myanmar confirmation message ──────────────────────────────
function formatConfirmationMessage(customerName: string, entries: any[], totalAmount: number, bettingType: string, session: string, date: Date | string) {
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
function detectBettingType(text: string): '2D' | '3D' {
  const lines = text.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d{3}\s+\d/.test(trimmed) || /^\d{3}-\d/.test(trimmed)) {
      return '3D';
    }
  }
  return '2D';
}

// ─── Telegram Bot Webhook Handler ─────────────────────────────────────────────
app.post('/webhook', async (c) => {
  const body: any = await c.req.json();
  const BOT_TOKEN = c.env.BOT_TOKEN;
  const KV = c.env.LOTTERY_KV;

  if (!body.message || !body.message.text) {
    return c.json({ ok: true });
  }

  const msg = body.message;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const telegramUserId = msg.from?.id;
  const customerName = msg.from?.first_name || msg.from?.username || `User_${telegramUserId}`;

  // Handle Commands
  if (text.startsWith('/start')) {
    const reply = `မင်္ဂလာပါ *${customerName}* 🎯\n\nMyanmar 2D/3D Lottery Bot မှ ကြိုဆိုပါသည်။\n\n*2D ထိုးနည်း:*\n\`12 500\`\n\`34 1000R\` (ပြောင်းပြန်)\n\n*3D ထိုးနည်း:*\n\`123 500\`\n\`456 1000R\` (ပြောင်းပြန်)\n\nလောင်းကြေးစာရင်းကို ဤပုံစံဖြင့် ပေးပို့ပါ။`;
    await sendTelegramMessage(BOT_TOKEN, chatId, reply);
    return c.json({ ok: true });
  }

  if (text.startsWith('/status')) {
    const now = new Date();
    const session = detectSession(now);
    const sessionKey = getSessionKey(now, session);
    const existing = await findCustomerByTelegramId(KV, telegramUserId, sessionKey);

    if (!existing) {
      await sendTelegramMessage(BOT_TOKEN, chatId, `ယနေ့ ${session === 'morning' ? 'မနက်' : 'ညနေ'}ပိုင်းအတွက် လောင်းကြေးမှတ်တမ်းမရှိသေးပါ။`);
    } else {
      const msg2 = formatConfirmationMessage(existing.name, existing.bettingData, existing.totalBet, existing.bettingType, session, now);
      await sendTelegramMessage(BOT_TOKEN, chatId, msg2);
    }
    return c.json({ ok: true });
  }

  // Handle Betting Text
  const bettingType = detectBettingType(text);
  const parsed = parseBettingText(text, bettingType);

  if (parsed.entries.length === 0) {
    const errorMsg = `❌ လောင်းကြေးစာရင်း မမှန်ကန်ပါ။\n\n*မှန်ကန်သောပုံစံ (2D):*\n\`12 500\`\n\`34 1000R\`\n\n*မှန်ကန်သောပုံစံ (3D):*\n\`123 500\`\n\`456 1000R\`\n\n` + (parsed.errors.length > 0 ? `*အမှားများ:*\n${parsed.errors.slice(0, 3).join('\n')}` : '');
    await sendTelegramMessage(BOT_TOKEN, chatId, errorMsg);
    return c.json({ ok: true });
  }

  const now = new Date();
  const session = detectSession(now);
  const sessionKey = getSessionKey(now, session);
  const existing = await findCustomerByTelegramId(KV, telegramUserId, sessionKey);

  if (existing) {
    await updateCustomer(KV, existing.id, {
      bettingData: parsed.entries,
      totalBet: parsed.totalAmount,
      bettingType,
      date: now.toISOString(),
    }, sessionKey);
  } else {
    await addCustomer(KV, {
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
    }, sessionKey);
  }

  const confirmMsg = formatConfirmationMessage(customerName, parsed.entries, parsed.totalAmount, bettingType, session, now);
  const finalMsg = parsed.errors.length > 0 ? confirmMsg + `\n\n⚠️ *ကျော်လွန်ခဲ့သောစာကြောင်းများ:*\n${parsed.errors.slice(0, 3).join('\n')}` : confirmMsg;
  
  await sendTelegramMessage(BOT_TOKEN, chatId, finalMsg);
  return c.json({ ok: true });
});

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    }),
  });
}

// ─── REST API Endpoints ───────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/customers', async (c) => {
  const { date, session } = c.req.query();
  if (!date || !session) return c.json({ error: 'Missing params' }, 400);
  
  const sessionKey = getSessionKey(new Date(date + 'T00:00:00'), session as any);
  const customers = await getCustomersForSession(c.env.LOTTERY_KV, sessionKey);
  return c.json({ customers, sessionKey, count: customers.length });
});

app.post('/api/customers', async (c) => {
  const { customer, date, session } = await c.req.json();
  const sessionKey = getSessionKey(new Date(date + 'T00:00:00'), session);
  const saved = await addCustomer(c.env.LOTTERY_KV, { ...customer, source: 'web' }, sessionKey);
  return c.json({ customer: saved, sessionKey }, 201);
});

app.put('/api/customers/:id', async (c) => {
  const id = c.req.param('id');
  const { updates, date, session } = await c.req.json();
  const sessionKey = getSessionKey(new Date(date + 'T00:00:00'), session);
  const updated = await updateCustomer(c.env.LOTTERY_KV, id, updates, sessionKey);
  if (!updated) return c.json({ error: 'Not found' }, 404);
  return c.json({ customer: updated });
});

app.delete('/api/customers/:id', async (c) => {
  const id = c.req.param('id');
  const { date, session } = c.req.query();
  const sessionKey = getSessionKey(new Date(date + 'T00:00:00'), session as any);
  const deleted = await deleteCustomer(c.env.LOTTERY_KV, id, sessionKey);
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true, id });
});

export default app;
