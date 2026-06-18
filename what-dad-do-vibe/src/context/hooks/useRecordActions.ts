/**
 * useRecordActions - 用户记录 actions
 *
 * 提供：addRecord / removeRecord
 */
import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createRecord, deleteRecord } from '../../lib/api';
import { notifyError } from '../notifyError';
import type { AppAction, AppState } from '../types';

export interface UserRecord {
  id: string;
  title: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface UseRecordActionsResult {
  addRecord: (record: Partial<UserRecord>) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
}

export function useRecordActions(
  user: User | null,
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
): UseRecordActionsResult {
  const addRecord = useCallback(async (record: Partial<UserRecord>) => {
    if (!user) return;
    try {
      const newRecord = await createRecord({
        user_id: user.id,
        baby_id: state.currentBabyId || undefined,
        title: record.title,
        content: record.content,
        is_private: record.isPrivate,
      });
      dispatch({
        type: 'ADD_RECORD',
        payload: {
          id: newRecord.id,
          title: newRecord.title,
          content: newRecord.content,
          isPrivate: newRecord.is_private,
          createdAt: new Date(newRecord.created_at).toLocaleDateString('zh-CN'),
        },
      });
    } catch (error) {
      notifyError('添加记录', error);
    }
  }, [user, state.currentBabyId, dispatch]);

  const removeRecord = useCallback(async (id: string) => {
    const recordToRestore = state.records.find(r => r.id === id);
    dispatch({ type: 'DELETE_RECORD', payload: id });
    try {
      await deleteRecord(id);
    } catch (error) {
      notifyError('删除记录', error);
      if (recordToRestore) dispatch({ type: 'ADD_RECORD', payload: recordToRestore });
    }
  }, [state.records, dispatch]);

  return { addRecord, removeRecord };
}