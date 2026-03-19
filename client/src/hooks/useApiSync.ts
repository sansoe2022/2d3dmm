import { useState, useEffect, useCallback, useRef } from 'react';
import type { CustomerRecord } from '../lib/customerManager';

const POLL_INTERVAL_MS = 30_000;

const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'https://betting-api-worker.sansoe5227.workers.dev';
const API_BASE_URL = rawApiUrl.replace(/\/$/, '');

export interface ApiCustomerRow {
  id: string;
  user_id: string;
  customer_name: string;
  betting_type: '2D' | '3D';
  betting_data: string | any[]; 
  total_amount: number;
  session: 'morning' | 'evening';
  bet_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string; // Reject အကြောင်းပြချက်အတွက် အသစ်ထည့်ထားသည်
}

interface UseApiSyncOptions {
  date: string;          
  session: 'morning' | 'evening';
  enabled?: boolean;     
}

interface UseApiSyncResult {
  remoteCustomers: CustomerRecord[];
  pendingCustomers: CustomerRecord[];
  isLoading: boolean;
  lastSynced: Date | null;
  apiAvailable: boolean;
  refresh: () => Promise<void>;
  approveCustomer: (id: string) => Promise<void>;
  rejectCustomer: (id: string, reason: string) => Promise<void>; // Reason ကို လက်ခံရန် ပြင်ဆင်ထားသည်
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
      
      if (!response.ok) throw new Error('Failed to fetch from API');

      const data: ApiCustomerRow[] = await response.json();
      
      const approved: CustomerRecord[] = [];
      const pending: CustomerRecord[] = [];

      data.forEach((item) => {
        const parsedBettingData = typeof item.betting_data === 'string' 
          ? JSON.parse(item.betting_data) 
          : item.betting_data;

        const formattedBets: any[] = [];
        parsedBettingData.forEach((bet: any) => {
          const numStr = String(bet.number);
          const amtStr = String(bet.amount).toUpperCase();
          const isReverse = amtStr.includes('R');
          const pureAmount = parseInt(amtStr.replace('R', '')) || 0;

          if (pureAmount > 0) {
            formattedBets.push({ number: numStr, amount: pureAmount });
            if (isReverse && numStr.length >= 2) {
              const reversedNum = numStr.split('').reverse().join('');
              if (reversedNum !== numStr) {
                formattedBets.push({ number: reversedNum, amount: pureAmount });
              }
            }
          }
        });

        const record: CustomerRecord = {
          id: item.id,
          name: item.customer_name,         
          bettingData: formattedBets,
          paymentType: 'cash',              
          weeklySettle: false,
          bettingType: item.betting_type,
          date: new Date(item.bet_date),    
          session: item.session,
          totalBet: item.total_amount,      
          source: 'api', 
          rejectReason: item.reason // Reason ကိုပါ ဖတ်ယူမည်
        } as CustomerRecord;

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

  useEffect(() => { fetchRemote(); }, [fetchRemote]);

  useEffect(() => {
    if (!enabled) return;
    timerRef.current = setInterval(fetchRemote, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchRemote, enabled]);

  // Status နဲ့ Reason ကို တွဲပို့ပေးမည်
  const updateStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const payload: any = { status };
      if (reason) payload.reason = reason;

      const response = await fetch(`${API_BASE_URL}/api/admin/submissions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to ${status} customer`);
      await fetchRemote();
    } catch (error) {
      console.error(`Error updating:`, error);
      throw error;
    }
  };

  return {
    remoteCustomers, pendingCustomers, isLoading, lastSynced,
    apiAvailable, refresh: fetchRemote,
    approveCustomer: (id: string) => updateStatus(id, 'approved'),
    rejectCustomer: (id: string, reason: string) => updateStatus(id, 'rejected', reason)
  };
}

export function mergeCustomers(local: CustomerRecord[], remote: CustomerRecord[]): CustomerRecord[] {
  const localIds = new Set(local.map(c => c.id));
  const newRemote = remote.filter(r => !localIds.has(r.id));
  const merged = [...local, ...newRemote];
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return merged;
}
