import { useEffect, useState, useCallback } from 'react';
import { getItemAsync, setItemAsync, KEYS } from '../lib/storage';
import { ToolId, DEFAULT_TOOLS } from '../lib/tools-config';

export function useUserTools(userId: string | null | undefined) {
  const [tools, setTools] = useState<ToolId[]>(DEFAULT_TOOLS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getItemAsync<ToolId[]>(KEYS.userTools(userId), DEFAULT_TOOLS)
      .then(setTools)
      .finally(() => setLoading(false));
  }, [userId]);

  const save = useCallback(async (next: ToolId[]) => {
    setTools(next);
    if (userId) await setItemAsync(KEYS.userTools(userId), next);
  }, [userId]);

  const add = useCallback((id: ToolId) => {
    if (tools.includes(id)) return;
    save([...tools, id]);
  }, [tools, save]);

  const remove = useCallback((id: ToolId) => {
    save(tools.filter(t => t !== id));
  }, [tools, save]);

  const toggle = useCallback((id: ToolId) => {
    save(tools.includes(id) ? tools.filter(t => t !== id) : [...tools, id]);
  }, [tools, save]);

  return { tools, loading, add, remove, toggle };
}