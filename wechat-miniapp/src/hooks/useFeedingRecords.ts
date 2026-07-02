import { useEffect, useState, useCallback } from 'react';
import { getItemAsync, setItemAsync, KEYS } from '../lib/storage';

export interface FeedingRecord {
  id: string;
  type: 'breast-left' | 'breast-right' | 'bottle';
  startAt: string;       // ISO
  durationSec: number;
}

export function useFeedingRecords(userId: string | null | undefined) {
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getItemAsync<FeedingRecord[]>(KEYS.feedingRecords(userId), [])
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [userId]);

  const persist = useCallback(async (next: FeedingRecord[]) => {
    setRecords(next);
    if (userId) await setItemAsync(KEYS.feedingRecords(userId), next);
  }, [userId]);

  const add = useCallback((rec: Omit<FeedingRecord, 'id'>) => {
    const next: FeedingRecord[] = [
      { ...rec, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      ...records,
    ];
    persist(next);
  }, [records, persist]);

  const remove = useCallback((id: string) => {
    persist(records.filter(r => r.id !== id));
  }, [records, persist]);

  return { records, loading, add, remove };
}