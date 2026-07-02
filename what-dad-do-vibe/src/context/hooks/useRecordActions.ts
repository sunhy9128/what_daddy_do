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

  /**
   * removeRecord — 乐观删除 + 失败回滚
   *
   * P1 #5 修复：不再用 find 结果做回滚（并发场景下可能覆盖新数据），
   * 而是在 API 调用失败后才从数据库重新拉取最新列表。
   */
  const removeRecord = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_RECORD', payload: id });
    try {
      await deleteRecord(id);
    } catch (error) {
      notifyError('删除记录', error);
      // P1 #5 修复：回滚时从数据库重新拉取，避免覆盖并发新增的同 ID 记录
      if (user && state.currentBabyId) {
        const { getRecords } = await import('../../lib/api');
        const latestRecords = await getRecords(user.id, state.currentBabyId);
        dispatch({
          type: 'SET_RECORDS',
          payload: latestRecords.map(r => ({
            id: r.id,
            title: r.title,
            content: r.content,
            isPrivate: r.is_private,
            createdAt: new Date(r.created_at).toLocaleDateString('zh-CN'),
          })),
        });
      } else {
        // 无法重新拉取时，从当前 state 找到被删的那条回滚（兜底）
        const recordToRestore = state.records.find(r => r.id === id);
        if (recordToRestore) dispatch({ type: 'ADD_RECORD', payload: recordToRestore });
      }
    }
  }, [user, state.currentBabyId, state.records, dispatch]);

  return { addRecord, removeRecord };
}