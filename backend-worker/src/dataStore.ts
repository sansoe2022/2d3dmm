/**
 * Cloudflare KV Data Store for Myanmar 2D/3D Lottery customers
 */

export interface CustomerRecord {
  id: string;
  name: string;
  telegramUserId?: number;
  telegramChatId?: number;
  bettingData: { number: string; amount: number }[];
  totalBet: number;
  bettingType: '2D' | '3D';
  paymentType: string;
  weeklySettle: boolean;
  session: 'morning' | 'evening';
  date: string;
  source: 'telegram' | 'web';
  createdAt: string;
  updatedAt?: string;
}

export function getSessionKey(date: Date | string, session: 'morning' | 'evening'): string {
  const d = date instanceof Date ? date : new Date(date);
  const dateStr = d.toISOString().split('T')[0];
  return `${dateStr}-${session}`;
}

export async function getCustomersForSession(KV: KVNamespace, sessionKey: string): Promise<CustomerRecord[]> {
  const data = await KV.get(sessionKey);
  return data ? JSON.parse(data) : [];
}

export async function addCustomer(KV: KVNamespace, customer: Partial<CustomerRecord>, sessionKey: string): Promise<CustomerRecord> {
  const customers = await getCustomersForSession(KV, sessionKey);
  
  const newCustomer: CustomerRecord = {
    ...customer,
    id: customer.id || `tg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: customer.createdAt || new Date().toISOString(),
    source: customer.source || 'telegram',
  } as CustomerRecord;

  customers.push(newCustomer);
  await KV.put(sessionKey, JSON.stringify(customers));
  return newCustomer;
}

export async function updateCustomer(KV: KVNamespace, customerId: string, updates: Partial<CustomerRecord>, sessionKey: string): Promise<CustomerRecord | null> {
  const customers = await getCustomersForSession(KV, sessionKey);
  const index = customers.findIndex(c => c.id === customerId);
  if (index === -1) return null;

  customers[index] = {
    ...customers[index],
    ...updates,
    id: customerId,
    updatedAt: new Date().toISOString(),
  };

  await KV.put(sessionKey, JSON.stringify(customers));
  return customers[index];
}

export async function deleteCustomer(KV: KVNamespace, customerId: string, sessionKey: string): Promise<boolean> {
  const customers = await getCustomersForSession(KV, sessionKey);
  const before = customers.length;
  const filtered = customers.filter(c => c.id !== customerId);

  if (filtered.length === before) return false;

  await KV.put(sessionKey, JSON.stringify(filtered));
  return true;
}

export async function findCustomerByTelegramId(KV: KVNamespace, telegramUserId: number, sessionKey: string): Promise<CustomerRecord | null> {
  const customers = await getCustomersForSession(KV, sessionKey);
  return customers.find(c => c.telegramUserId === telegramUserId) || null;
}
