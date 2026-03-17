/**
 * Customer Management Utilities
 * 
 * Manages daily customer records with localStorage persistence
 * Storage is keyed by date + session (morning/evening)
 * Format: lottery_customers_{YYYY-MM-DD-session}
 */

export interface BettingEntry {
  number: string;
  amount: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  bettingData: BettingEntry[];
  paymentType: "cash" | "credit"; // cash upfront or credit/debt
  weeklySettle: boolean; // တစ်ပတ်ရှင်း (weekly clear)
  totalBet: number;
  date: Date;
  session: "morning" | "evening";
  bettingType: "2D" | "3D";
  createdAt?: string;
  source?: "web" | "telegram"; // origin of the record
  telegramUserId?: number;
  telegramChatId?: number;
}

export interface DailyCustomerData {
  date: string;
  customers: CustomerRecord[];
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get session key in format YYYY-MM-DD-session (using local timezone)
 */
export function getSessionKey(date: Date, session: "morning" | "evening"): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  return `${dateStr}-${session}`;
}

/**
 * Get storage key for session-aware customers
 */
function getStorageKey(sessionKey: string): string {
  return `lottery_customers_${sessionKey}`;
}

/**
 * Parse date string in YYYY-MM-DDTHH:mm:ss format to Date object (local timezone)
 */
function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try to parse YYYY-MM-DDTHH:mm:ss format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hours, minutes, seconds] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
  }
  
  // Fallback to standard Date parsing
  return new Date(dateStr);
}

/**
 * Get all customers for a specific session
 */
export function getCustomersForSession(sessionKey: string): CustomerRecord[] {
  try {
    const key = getStorageKey(sessionKey);
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const customers = JSON.parse(data);
    // Convert date strings back to Date objects (parse local timezone string)
    return customers.map((c: any) => ({
      ...c,
      date: parseDateString(c.date),
    }));
  } catch (error) {
    console.error("Error reading customers from localStorage:", error);
    return [];
  }
}

/**
 * Legacy function for backward compatibility - gets customers for today morning
 */
export function getCustomersForDate(date: string = getTodayDate()): CustomerRecord[] {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
  const sessionKey = getSessionKey(dateObj, "morning");
  return getCustomersForSession(sessionKey);
}

/**
 * Add a new customer record (new version with full customer object)
 */
export function addCustomer(
  customer: CustomerRecord,
  date: Date,
  session: "morning" | "evening"
): CustomerRecord {
  const sessionKey = getSessionKey(date, session);
  const customers = getCustomersForSession(sessionKey);

  const newCustomer: CustomerRecord = {
    ...customer,
    id: customer.id || `customer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: customer.createdAt || new Date().toISOString(),
  };

  customers.push(newCustomer);
  saveCustomers(customers, sessionKey);

  return newCustomer;
}

/**
 * Update an existing customer record in a session
 */
export function updateCustomerInSession(
  customerId: string,
  updates: Partial<Omit<CustomerRecord, "id" | "createdAt">>,
  sessionKey: string
): CustomerRecord | null {
  const customers = getCustomersForSession(sessionKey);
  const index = customers.findIndex((c) => c.id === customerId);

  if (index === -1) return null;

  customers[index] = {
    ...customers[index],
    ...updates,
  };

  saveCustomers(customers, sessionKey);
  return customers[index];
}

/**
 * Update an existing customer record (legacy - uses today morning)
 */
export function updateCustomer(
  customerId: string,
  updates: Partial<Omit<CustomerRecord, "id" | "createdAt">>,
  date: string = getTodayDate()
): CustomerRecord | null {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
  const sessionKey = getSessionKey(dateObj, "morning");
  return updateCustomerInSession(customerId, updates, sessionKey);
}

/**
 * Delete a customer record from a session
 */
export function deleteCustomerFromSession(customerId: string, sessionKey: string): boolean {
  const customers = getCustomersForSession(sessionKey);
  const filtered = customers.filter((c) => c.id !== customerId);

  if (filtered.length === customers.length) return false; // Not found

  saveCustomers(filtered, sessionKey);
  return true;
}

/**
 * Delete a customer record (legacy - uses today morning)
 */
export function deleteCustomer(customerId: string, date: string = getTodayDate()): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
  const sessionKey = getSessionKey(dateObj, "morning");
  return deleteCustomerFromSession(customerId, sessionKey);
}

/**
 * Save customers to localStorage
 */
function saveCustomers(customers: CustomerRecord[], sessionKey: string): void {
  try {
    const key = getStorageKey(sessionKey);
    // Convert Date objects to local timezone string for JSON serialization
    const serialized = customers.map((c) => {
      let dateStr: string;
      if (c.date instanceof Date) {
        const year = c.date.getFullYear();
        const month = String(c.date.getMonth() + 1).padStart(2, '0');
        const day = String(c.date.getDate()).padStart(2, '0');
        const hours = String(c.date.getHours()).padStart(2, '0');
        const minutes = String(c.date.getMinutes()).padStart(2, '0');
        const seconds = String(c.date.getSeconds()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      } else {
        dateStr = c.date;
      }
      return {
        ...c,
        date: dateStr,
      };
    });
    localStorage.setItem(key, JSON.stringify(serialized));
  } catch (error) {
    console.error("Error saving customers to localStorage:", error);
  }
}

/**
 * Clear all customers for a specific session
 */
export function clearCustomersForSession(sessionKey: string): void {
  try {
    const key = getStorageKey(sessionKey);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing customers from localStorage:", error);
  }
}

/**
 * Clear all customers for a specific date (legacy - clears all sessions for that date)
 */
export function clearCustomersForDate(date: string = getTodayDate()): void {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
  clearCustomersForSession(getSessionKey(dateObj, "morning"));
  clearCustomersForSession(getSessionKey(dateObj, "evening"));
}

/**
 * Get all dates that have customer data
 */
export function getAllCustomerDates(): string[] {
  try {
    const keys = Object.keys(localStorage);
    const customerKeys = keys.filter((k) => k.startsWith("lottery_customers_"));
    const dates = customerKeys.map((k) => k.replace("lottery_customers_", ""));
    return dates.sort().reverse(); // Most recent first
  } catch (error) {
    console.error("Error getting customer dates:", error);
    return [];
  }
}
