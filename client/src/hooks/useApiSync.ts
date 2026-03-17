/**
 * useApiSync hook
 * Polls the backend API every 30 seconds and merges remote customers
 * with localStorage customers. Remote records (from Telegram bot) are
 * identified by source='telegram' and merged without duplicates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CustomerRecord } from '../lib/customerManager';
import { fetchCustomersFromApi, apiCustomerToRecord } from '../lib/apiClient';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

interface UseApiSyncOptions {
  date: string;          // YYYY-MM-DD
  session: 'morning' | 'evening';
  enabled?: boolean;     // set false to disable polling
}

interface UseApiSyncResult {
  remoteCustomers: CustomerRecord[];
  isLoading: boolean;
  lastSynced: Date | null;
  apiAvailable: boolean;
  refresh: () => Promise<void>;
}

export function useApiSync({ date, session, enabled = true }: UseApiSyncOptions): UseApiSyncResult {
  const [remoteCustomers, setRemoteCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRemote = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);

    try {
      const apiCustomers = await fetchCustomersFromApi(date, session);
      if (apiCustomers !== null) {
        setApiAvailable(true);
        const records = apiCustomers.map(apiCustomerToRecord);
        setRemoteCustomers(records);
        setLastSynced(new Date());
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [date, session, enabled]);

  // Initial fetch + re-fetch on date/session change
  useEffect(() => {
    fetchRemote();
  }, [fetchRemote]);

  // Polling interval
  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(fetchRemote, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchRemote, enabled]);

  return {
    remoteCustomers,
    isLoading,
    lastSynced,
    apiAvailable,
    refresh: fetchRemote,
  };
}

/**
 * Merge local (localStorage) customers with remote (API) customers.
 * - Remote customers with source='telegram' that don't exist locally are added.
 * - Local customers always take precedence (they may have been edited in the web app).
 * - Deduplication is by customer id.
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
