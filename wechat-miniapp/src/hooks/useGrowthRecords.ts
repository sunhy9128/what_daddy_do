import { useEffect, useState, useCallback } from 'react';
import { getItemAsync, setItemAsync, KEYS } from '../lib/storage';

export interface GrowthRecord {
  id: string;
  date: string;        // YYYY-MM-DD
  heightCm: number;    // 身高 cm
  weightKg: number;    // 体重 kg
}

export function useGrowthRecords(userId: string | null | undefined) {
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getItemAsync<GrowthRecord[]>(KEYS.growthRecords(userId), [])
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [userId]);

  const persist = useCallback(async (next: GrowthRecord[]) => {
    setRecords(next);
    if (userId) await setItemAsync(KEYS.growthRecords(userId), next);
  }, [userId]);

  const add = useCallback((rec: Omit<GrowthRecord, 'id'>) => {
    const next: GrowthRecord[] = [
      { ...rec, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      ...records,
    ].sort((a, b) => b.date.localeCompare(a.date));
    persist(next);
  }, [records, persist]);

  const remove = useCallback((id: string) => {
    persist(records.filter(r => r.id !== id));
  }, [records, persist]);

  return { records, loading, add, remove };
}