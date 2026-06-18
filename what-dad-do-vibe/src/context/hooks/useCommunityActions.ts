/**
 * useCommunityActions - 社区帖子 + 紧急事项 actions
 *
 * 提供：
 * - refreshCommunityPosts / addPost
 * - addUrgentNote / dismissUrgentNote
 */
import { useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import {
  getCommunityPosts,
  createCommunityPost,
  createUrgentNote as createUrgentNoteInDb,
  dismissUrgentNote as dismissUrgentNoteInDb,
} from '../../lib/api';
import { notifyError } from '../notifyError';
import type { AppAction, AppState, CommunityPost, UrgentNote } from '../types';

export interface UseCommunityActionsResult {
  refreshCommunityPosts: (category?: string) => Promise<void>;
  addPost: (post: { title: string; content: string; category: string }) => Promise<void>;
  addUrgentNote: (content: string) => Promise<void>;
  dismissUrgentNote: (id: string) => Promise<void>;
}

export function useCommunityActions(
  user: User | null,
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
): UseCommunityActionsResult {
  const refreshCommunityPosts = useCallback(async (category?: string) => {
    try {
      const posts = await getCommunityPosts(category);
      dispatch({
        type: 'SET_COMMUNITY_POSTS',
        payload: posts.map<CommunityPost>(p => ({
          id: p.id,
          userId: p.user_id,
          authorName: p.author_name,
          title: p.title,
          content: p.content,
          category: p.category,
          likes: p.likes,
          comments: p.comments,
          createdAt: p.created_at,
        })),
      });
    } catch (error) {
      notifyError('刷新社区帖子', error);
    }
  }, [dispatch]);

  const addPost = useCallback(async (post: { title: string; content: string; category: string }) => {
    if (!user) return;
    const authorName = user.user_metadata?.nickname || user.email?.split('@')[0] || '爸爸';
    try {
      const newPost = await createCommunityPost({
        user_id: user.id,
        author_name: authorName,
        title: post.title,
        content: post.content,
        category: post.category,
      });
      dispatch({
        type: 'ADD_COMMUNITY_POST',
        payload: {
          id: newPost.id,
          userId: newPost.user_id,
          authorName: newPost.author_name,
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          likes: 0,
          comments: 0,
          createdAt: newPost.created_at,
        },
      });
    } catch (error) {
      notifyError('发布帖子', error);
    }
  }, [user, dispatch]);

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

  return { refreshCommunityPosts, addPost, addUrgentNote, dismissUrgentNote };
}