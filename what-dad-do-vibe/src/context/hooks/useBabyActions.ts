/**
 * useBabyActions - 宝宝管理 actions
 *
 * 提供：addBaby / updateBabyGender / setActiveBaby / archiveBaby / reorderBabies
 *
 * 持有内部 ref：
 * - switchingRef: setActiveBaby 的 re-entrancy guard
 * - babiesRef: P0 #2 修复，避免闭包中 state.babies 过时
 */
import { useCallback, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import {
  createBaby as createBabyInDb,
  updateBaby as updateBabyInDb,
  archiveBaby as archiveBabyInDb,
  reorderBabies as reorderBabiesInDb,
  getTasks,
  getRecords,
} from '../../lib/api';
import { PregnancyStage, calculateStageFromDueDate, calculateBirthAge } from '../../lib/stages';
import { saveCurrentBabyId } from '../../lib/storage';
import { notifyError } from '../notifyError';
import { ensurePresetTasksForBaby } from '../ensurePresetTasks';
import type { AppAction, AppState, Baby } from '../types';

export interface UseBabyActionsResult {
  addBaby: (dueDate: string, name?: string, birthDate?: string) => Promise<void>;
  updateBabyGender: (babyId: string, gender: string, dueDate?: string, birthDate?: string, name?: string) => Promise<void>;
  setActiveBaby: (id: string) => Promise<void>;
  archiveBaby: (id: string) => Promise<void>;
  reorderBabies: (orderedIds: string[]) => Promise<void>;
}

export function useBabyActions(
  user: User | null,
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
): UseBabyActionsResult {
  const switchingRef = useRef(false);

  // P0 #2 修复：用 ref 持有最新 babies 列表，避免 setActiveBaby 闭包中 state.babies 过时
  const babiesRef = useRef<Baby[]>([]);
  useEffect(() => {
    babiesRef.current = state.babies;
  }, [state.babies]);

  const addBaby = useCallback(async (dueDate: string, name: string = '宝宝', birthDate?: string) => {
    if (!user) return;
    const nextSortOrder = state.babies.length;
    try {
      const baby = await createBabyInDb({
        user_id: user.id,
        due_date: dueDate,
        birth_date: birthDate || null,
        name,
        sort_order: nextSortOrder,
        is_active: true,
        is_archived: false,
      });
      const calc = calculateStageFromDueDate(dueDate);
      const birthAgeLabel = calc.stage === 'postpartum' ? calculateBirthAge(dueDate, birthDate) : '';
      dispatch({
        type: 'ADD_BABY',
        payload: {
          baby: {
            id: baby.id,
            dueDate: baby.due_date,
            birthDate: baby.birth_date,
            name: baby.name,
            gender: undefined,
            is_active: true,
            is_archived: false,
            sort_order: nextSortOrder,
          },
          stage: calc.stage,
          weeksPregnant: calc.weeksPregnant,
          birthAgeLabel,
        },
      });
      dispatch({ type: 'SET_STAGE', payload: calc.stage });
      // 新宝宝自动设为当前
      await saveCurrentBabyId(user.id, baby.id);
      dispatch({ type: 'SET_CURRENT_BABY', payload: baby.id });
    } catch (error) {
      notifyError('添加宝宝', error);
    }
  }, [user, state.babies.length, dispatch]);

  const updateBabyGender = useCallback(async (
    babyId: string,
    gender: string,
    dueDate?: string,
    birthDate?: string,
    name?: string,
  ) => {
    const updates: { [k: string]: string } = {};
    if (dueDate) updates.due_date = dueDate;
    if (gender) updates.gender = gender;
    if (birthDate) updates.birth_date = birthDate;
    if (name) updates.name = name;
    try {
      await updateBabyInDb(babyId, updates);
      const today = dueDate || new Date().toISOString().split('T')[0];
      const calc = calculateStageFromDueDate(today);
      const birthAgeLabel = calc.stage === 'postpartum' ? calculateBirthAge(today, birthDate) : '';
      dispatch({
        type: 'SET_BABIES',
        payload: {
          babies: state.babies.map(b => b.id === babyId ? { ...b, ...(gender ? { gender } : {}), ...(name ? { name: name } : {}), dueDate: today, birthDate: birthDate || b.birthDate } : b),
          stage: calc.stage,
          weeksPregnant: calc.weeksPregnant,
          birthAgeLabel,
        },
      });
      dispatch({ type: 'SET_STAGE', payload: calc.stage });
    } catch (error) {
      notifyError('更新宝宝信息', error);
    }
  }, [state.babies, state.stage, state.weeksPregnant, dispatch]);

  const setActiveBaby = useCallback(async (id: string) => {
    if (!user || switchingRef.current) return;
    const previousBabyId = state.currentBabyId;
    switchingRef.current = true;
    try {
      await saveCurrentBabyId(user.id, id);
      dispatch({ type: 'SET_CURRENT_BABY', payload: id });

      // 用 ref 取最新 babies 列表，避免闭包过时
      const currentBaby = babiesRef.current.find(b => b.id === id);
      let autoStage: PregnancyStage = 'preconception';
      let weeksPregnant = 0;
      let birthAgeLabel = '';
      if (currentBaby?.dueDate) {
        const calc = calculateStageFromDueDate(currentBaby.dueDate);
        autoStage = calc.stage;
        weeksPregnant = calc.weeksPregnant;
        if (calc.stage === 'postpartum') {
          birthAgeLabel = calculateBirthAge(currentBaby.dueDate, currentBaby.birthDate);
        }
      }

      const [tasksData, recordsData] = await Promise.all([
        getTasks(user.id, id),
        getRecords(user.id, id),
      ]);

      const todayStr = new Date().toISOString().split('T')[0];

      dispatch({
        type: 'SET_TASKS',
        payload: tasksData.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          stage: t.stage as PregnancyStage,
          type: t.type,
          taskSubtype: t.task_subtype || 'one_time',
          dueDate: t.due_date || undefined,
          completedAt: t.completed_at || undefined,
          dailyCount: t.daily_date === todayStr ? t.daily_count : 0,
          dailyDate: t.daily_date === todayStr ? t.daily_date : undefined,
          isCompleted: t.type === 'checkin' ? t.last_checkin_date === todayStr : t.is_completed,
          streakCount: t.streak_count || 0,
          lastCheckinDate: t.last_checkin_date || undefined,
        })),
      });

      dispatch({
        type: 'SET_RECORDS',
        payload: recordsData.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          isPrivate: r.is_private,
          createdAt: new Date(r.created_at).toLocaleDateString('zh-CN'),
        })),
      });

      dispatch({ type: 'SET_STAGE', payload: autoStage });
      dispatch({
        type: 'SET_BABIES',
        payload: {
          babies: babiesRef.current.map(b => ({ ...b })),
          stage: autoStage,
          weeksPregnant,
          birthAgeLabel,
        },
      });

      // P1 #5 修复：切宝宝时也走预设任务注入流程
      await ensurePresetTasksForBaby(user.id, id);
    } catch (error) {
      notifyError('切换宝宝', error);
      // 失败回滚到之前的 currentBabyId
      if (previousBabyId !== null) {
        await saveCurrentBabyId(user.id, previousBabyId);
        dispatch({ type: 'SET_CURRENT_BABY', payload: previousBabyId });
      }
    } finally {
      switchingRef.current = false;
    }
  }, [user, state.currentBabyId, dispatch]);

  const archiveBaby = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await archiveBabyInDb(id);
      dispatch({ type: 'ARCHIVE_BABY', payload: id });
      if (state.currentBabyId === id) {
        const remainingActive = state.babies.filter(b => b.id !== id && !b.is_archived);
        const next = remainingActive[0]?.id ?? null;
        if (next) {
          await saveCurrentBabyId(user.id, next);
          dispatch({ type: 'SET_CURRENT_BABY', payload: next });
          const [tasksData, recordsData] = await Promise.all([
            getTasks(user.id, next),
            getRecords(user.id, next),
          ]);
          const todayStr = new Date().toISOString().split('T')[0];
          dispatch({
            type: 'SET_TASKS',
            payload: tasksData.map(t => ({
              id: t.id, title: t.title, description: t.description || undefined,
              stage: t.stage as PregnancyStage, type: t.type,
              taskSubtype: t.task_subtype || 'one_time', dueDate: t.due_date || undefined,
              completedAt: t.completed_at || undefined,
              dailyCount: t.daily_date === todayStr ? t.daily_count : 0,
              dailyDate: t.daily_date === todayStr ? t.daily_date : undefined,
              isCompleted: t.type === 'checkin' ? t.last_checkin_date === todayStr : t.is_completed,
              streakCount: t.streak_count || 0, lastCheckinDate: t.last_checkin_date || undefined,
            })),
          });
          dispatch({
            type: 'SET_RECORDS',
            payload: recordsData.map(r => ({
              id: r.id, title: r.title, content: r.content,
              isPrivate: r.is_private, createdAt: new Date(r.created_at).toLocaleDateString('zh-CN'),
            })),
          });
        }
      }
    } catch (error) {
      notifyError('归档宝宝', error);
    }
  }, [user, state.currentBabyId, state.babies, dispatch]);

  const reorderBabies = useCallback(async (orderedIds: string[]) => {
    if (!user) return;
    const originalOrder = state.babies.map(b => b.id);
    dispatch({ type: 'REORDER_BABIES', payload: orderedIds });
    try {
      await reorderBabiesInDb(user.id, orderedIds);
    } catch (error) {
      notifyError('重排宝宝顺序', error);
      dispatch({ type: 'REORDER_BABIES', payload: originalOrder });
    }
  }, [user, state.babies, dispatch]);

  return { addBaby, updateBabyGender, setActiveBaby, archiveBaby, reorderBabies };
}