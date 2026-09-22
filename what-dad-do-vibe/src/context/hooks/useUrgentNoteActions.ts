/**
 * useUrgentNoteActions - 紧急事项 actions
 *
 * 提供：
 * - addUrgentNote / dismissUrgentNote
 */
import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import {
  createUrgentNote as createUrgentNoteInDb,
  dismissUrgentNote as dismissUrgentNoteInDb,
} from '../../lib/api';
import { notifyError } from '../notifyError';
import type { AppAction, AppState, UrgentNote } from '../types';

export interface UseUrgentNoteActionsResult {
  addUrgentNote: (content: string) => Promise<void>;
  dismissUrgentNote: (id: string) => Promise<void>;
}

export function useUrgentNoteActions(
  user: User | null,
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
): UseUrgentNoteActionsResult {
  const addUrgentNote = useCallback(async (content: string) => {
    if (!user) return;
    try {
      const note = await createUrgentNoteInDb({ user_id: user.id, content });
      const payload: UrgentNote = {
        id: note.id,
        content: note.content,
        isActive: note.is_active,
        createdAt: new Date(note.created_at).toLocaleDateString('zh-CN'),
      };
      dispatch({ type: 'ADD_URGENT_NOTE', payload });
    } catch (error) {
      notifyError('添加紧急事项', error);
    }
  }, [user, dispatch]);

  const dismissUrgentNote = useCallback(async (id: string) => {
    const noteToRestore = state.urgentNotes.find(n => n.id === id);
    dispatch({ type: 'REMOVE_URGENT_NOTE', payload: id });
    try {
      await dismissUrgentNoteInDb(id);
    } catch (error) {
      notifyError('关闭紧急事项', error);
      if (noteToRestore) dispatch({ type: 'ADD_URGENT_NOTE', payload: noteToRestore });
    }
  }, [state.urgentNotes, dispatch]);

  return { addUrgentNote, dismissUrgentNote };
}
