/**
 * useApiSync hook
 * Polls the backend API every 30 seconds and fetches both approved and pending customers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CustomerRecord } from '../lib/customerManager';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

// Automatically remove any trailing slash to prevent double-slash URL errors
const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'https://betting-api-worker.sansoe5227.workers.dev';
const API_BASE_URL = rawApiUrl.replace(/\/$/, '');

// Define the exact structure coming from the D1 Database
export interface ApiCustomerRow {
  id: string;
  user_id: string;
  customer_name: string;
  betting_type: '2D' | '3D';
  betting_data: string | any[]; // Sometimes stored as a stringified JSON
  total_amount: number;
  session: 'morning' | 'evening';
  bet_date: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface UseApiSyncOptions {
  date: string;          // YYYY-MM-DD
  session: 'morning' | 'evening';
  enabled?: boolean;     // set false to disable polling
}

interface UseApiSyncResult {
  remoteCustomers: CustomerRecord[];
  pendingCustomers: CustomerRecord[];
  isLoading: boolean;
  lastSynced: Date | null;
  apiAvailable: boolean;
  refresh: () => Promise<void>;
  approveCustomer: (id: string) => Promise<void>;
  rejectCustomer: (id: string) => Promise<void>;
}

export function useApiSync({ date, session, enabled = true }: UseApiSyncOptions): UseApiSyncResult {
  const [remoteCustomers, setRemoteCustomers] = useState<CustomerRecord[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRemote = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/submissions?date=${date}&session=${session}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }

      const data: ApiCustomerRow[] = await response.json();
      
      const approved: CustomerRecord[] = [];
      const pending: CustomerRecord[] = [];

      data.forEach((item) => {
        // Parse the betting_data string back into an array if needed
        const parsedBettingData = typeof item.betting_data === 'string' 
          ? JSON.parse(item.betting_data) 
          : item.betting_data;

        // Map the database columns to the React app's expected properties (ဂုဏ်သတ္တိများကို ကိုက်ညီအောင် ညှိပေးခြင်း)
        const record: CustomerRecord = {
          id: item.id,
          name: item.customer_name,         // DB customer_name -> React name
          bettingData: parsedBettingData,
          paymentType: 'cash',              // Default online submissions to 'cash'
          weeklySettle: false,
          bettingType: item.betting_type,
          date: new Date(item.bet_date),    // DB bet_date -> React date
          session: item.session,
          totalBet: item.total_amount,      // DB total_amount -> React totalBet
          source: 'api', 
        };

        if (item.status === 'pending') {
          pending.push(record);
        } else if (item.status === 'approved') {
          approved.push(record);
        }
      });

      setRemoteCustomers(approved);
      setPendingCustomers(pending);
      setLastSynced(new Date());
      setApiAvailable(true);
    } catch (error) {
      console.error('API Sync Error:', error);
      setApiAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [date, session, enabled]);

  // Initial fetch + re-fetch on date/session change
  useEffect(() => {
    fetchRemote();
  }, [fetchRemote]);

  // Interval execution for polling
  useEffect(() => {
    if (!enabled) return;
    timerRef.current = setInterval(fetchRemote, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchRemote, enabled]);

  // Status mutation function
  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/submissions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error(`Failed to ${status} customer`);
      
      // Re-fetch data immediately after successful status change
      await fetchRemote();
    } catch (error) {
      console.error(`Error updating customer status to ${status}:`, error);
      throw error;
    }
  };

  const approveCustomer = (id: string) => updateStatus(id, 'approved');
  const rejectCustomer = (id: string) => updateStatus(id, 'rejected');

  return {
    remoteCustomers,
    pendingCustomers,
    isLoading,
    lastSynced,
    apiAvailable,
    refresh: fetchRemote,
    approveCustomer,
    rejectCustomer
  };
}

export function mergeCustomers(
  local: CustomerRecord[],
  remote: CustomerRecord[]
): CustomerRecord[] {
  const localIds = new Set(local.map(c => c.id));
  const newRemote = remote.filter(r => !localIds.has(r.id));
  const merged = [...local, ...newRemote];
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return merged;
}
