/**
 * API client for the Myanmar 2D/3D Lottery backend server.
 * The backend URL is configured via VITE_API_URL env variable.
 * Falls back gracefully when the backend is unavailable.
 */

import type { CustomerRecord } from './customerManager';

// Backend API base URL - set VITE_API_URL in your .env file
// e.g. VITE_API_URL=http://your-vps-ip:4000
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '';

export interface ApiCustomer {
  id: string;
  name: string;
  bettingData: Array<{ number: string; amount: number }>;
  totalBet: number;
  bettingType: '2D' | '3D';
  paymentType: 'cash' | 'credit';
  weeklySettle?: boolean;
  session: 'morning' | 'evening';
  date: string;
  source?: 'telegram' | 'web';
  telegramUserId?: number;
  createdAt?: string;
}

/**
 * Convert an API customer to a CustomerRecord (frontend type)
 */
export function apiCustomerToRecord(c: ApiCustomer): CustomerRecord {
  return {
    ...c,
    date: new Date(c.date),
    weeklySettle: c.weeklySettle ?? false,
    source: c.source,
  } as CustomerRecord;
}

/**
 * Fetch customers from the backend API for a given date/session.
 * Returns null if the backend is unreachable.
 */
export async function fetchCustomersFromApi(
  date: string,
  session: 'morning' | 'evening'
): Promise<ApiCustomer[] | null> {
  if (!API_BASE) return null;

  try {
    const url = `${API_BASE}/api/customers?date=${date}&session=${session}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.customers ?? null;
  } catch {
    return null;
  }
}

/**
 * Delete a customer via the backend API.
 * Returns true on success, false on failure.
 */
export async function deleteCustomerFromApi(
  id: string,
  date: string,
  session: 'morning' | 'evening'
): Promise<boolean> {
  if (!API_BASE) return false;

  try {
    const url = `${API_BASE}/api/customers/${id}?date=${date}&session=${session}`;
    const res = await fetch(url, { method: 'DELETE', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Update a customer via the backend API.
 * Returns the updated customer or null on failure.
 */
export async function updateCustomerInApi(
  id: string,
  updates: Partial<ApiCustomer>,
  date: string,
  session: 'morning' | 'evening'
): Promise<ApiCustomer | null> {
  if (!API_BASE) return null;

  try {
    const url = `${API_BASE}/api/customers/${id}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, date, session }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.customer ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if the backend API is reachable.
 */
export async function checkApiHealth(): Promise<boolean> {
  if (!API_BASE) return false;

  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
