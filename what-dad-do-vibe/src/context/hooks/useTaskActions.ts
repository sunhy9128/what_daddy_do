/**
 * useTaskActions - 任务相关 actions
 *
 * 提供：toggleTask / addTask / removeTask / updateTask
 *
 * 所有 async actions 都做：
 * - optimistic dispatch
 * - try/catch + notifyError 反馈
 * - 失败时回滚到原状态
 *
 * 接收 user / state / dispatch 作为依赖，不持有自己的 ref。
 */
import { useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import {
  createTask,
  toggleTaskComplete,
  deleteTask,
  updateTask as updateTaskInDb,
} from '../../lib/api';
import { toSnakeCaseKeys } from '../../lib/utils/camelToSnake';
import { PregnancyStage } from '../../lib/stages';
import { notifyError } from '../notifyError';
import type { AppAction, AppState, Task } from '../types';

export interface UseTaskActionsResult {
  toggleTask: (id: string) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
}

export function useTaskActions(
  user: User | null,
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
): UseTaskActionsResult {
  const togglingRef = useRef(false);

  const toggleTask = useCallback(async (id: string) => {
    if (togglingRef.current) return;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    togglingRef.current = true;
    const today = new Date().toISOString().split('T')[0];

    try {
      if (task.type === 'checkin') {
        let newStreak = 1;
        if (task.lastCheckinDate) {
          const lastDate = new Date(task.lastCheckinDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) return;
          else if (diffDays === 1) newStreak = task.streakCount + 1;
        }
        dispatch({ type: 'UPDATE_TASK', payload: { id, updates: { streakCount: newStreak, lastCheckinDate: today, isCompleted: true } } });
        await updateTaskInDb(id, { streak_count: newStreak, last_checkin_date: today, is_completed: true });
      } else if (task.taskSubtype === 'recurring' || task.type === 'daily') {
        const newCount = task.dailyDate === today ? task.dailyCount + 1 : 1;
        dispatch({ type: 'UPDATE_TASK', payload: { id, updates: { dailyCount: newCount, dailyDate: today } } });
        await updateTaskInDb(id, { daily_count: newCount, daily_date: today });
      } else {
        dispatch({ type: 'TOGGLE_TASK', payload: id });
        await toggleTaskComplete(id, !task.isCompleted);
      }
    } catch (error) {
      notifyError('更新任务', error);
      // 回滚 optimistic update
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates: task } });
    } finally {
      togglingRef.current = false;
    }
  }, [state.tasks, dispatch]);

  const addTask = useCallback(async (task: Partial<Task>) => {
    if (!user || !state.currentBabyId) return;
    const taskSubtype = task.taskSubtype || (task.type === 'daily' ? 'recurring' : 'one_time');

    try {
      const newTask = await createTask({
        user_id: user.id,
        baby_id: state.currentBabyId,
        title: task.title,
        description: task.description || null,
        stage: task.stage,
        type: task.type,
        task_subtype: taskSubtype,
        due_date: task.dueDate || null,
        is_completed: false,
        daily_count: 0,
      });
      dispatch({
        type: 'ADD_TASK',
        payload: {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description || undefined,
          stage: newTask.stage as PregnancyStage,
          type: newTask.type,
          taskSubtype: newTask.task_subtype as 'one_time' | 'recurring',
          dueDate: newTask.due_date || undefined,
          isCompleted: false,
          dailyCount: 0,
          streakCount: 0,
          lastCheckinDate: undefined,
        },
      });
    } catch (error) {
      notifyError('添加任务', error);
    }
  }, [user, state.currentBabyId, dispatch]);

  const removeTask = useCallback(async (id: string) => {
    const taskToRestore = state.tasks.find(t => t.id === id);
    dispatch({ type: 'DELETE_TASK', payload: id });
    try {
      await deleteTask(id);
    } catch (error) {
      notifyError('删除任务', error);
      if (taskToRestore) dispatch({ type: 'ADD_TASK', payload: taskToRestore });
    }
  }, [state.tasks, dispatch]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const original = state.tasks.find(t => t.id === id);
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
    try {
      const updatesObj = updates as { [k: string]: unknown };
      const dbUpdates = toSnakeCaseKeys(updatesObj);
      await updateTaskInDb(id, dbUpdates as any);
    } catch (error) {
      notifyError('更新任务', error);
      if (original) dispatch({ type: 'UPDATE_TASK', payload: { id, updates: original } });
    }
  }, [state.tasks, dispatch]);

  return { toggleTask, addTask, removeTask, updateTask };
}