/**
 * useApiSync hook
 * Polls the backend API every 30 seconds and fetches both approved and pending customers.
 * Remote records (from Customer App) are identified by source='api' and merged without duplicates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CustomerRecord } from '../lib/customerManager';

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-worker-url.workers.dev';

// Define the API response structure
export interface ApiCustomer extends Omit<CustomerRecord, 'date'> {
  date: string; // ISO string format from the API
  status?: 'pending' | 'approved' | 'rejected';
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

      const data: ApiCustomer[] = await response.json();
      
      const approved: CustomerRecord[] = [];
      const pending: CustomerRecord[] = [];

      data.forEach((item) => {
        // Convert the string date back to a JavaScript Date object
        const record: CustomerRecord = {
          ...item,
          date: new Date(item.date),
          source: 'api', // Mark as coming from the new API
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

  // Mutation (ပြုပြင်ပြောင်းလဲခြင်း) to update status
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

/**
 * Merge local (localStorage) customers with remote (API) customers.
 * - Remote customers that don't exist locally are added.
 * - Local customers always take precedence (ဦးစားပေးမှု) (they may have been edited in the web app).
 * - Deduplication (ထပ်နေသော ဒေတာများကို ဖယ်ရှားခြင်း) is handled by customer id.
 */
export function mergeCustomers(
  local: CustomerRecord[],
  remote: CustomerRecord[]
): CustomerRecord[] {
  const localIds = new Set(local.map(c => c.id));

  // Only add remote customers that don't exist locally
  const newRemote = remote.filter(r => !localIds.has(r.id));

  // Combine: local first, then new remote ones (sorted by date desc)
  const merged = [...local, ...newRemote];
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return merged;
}
