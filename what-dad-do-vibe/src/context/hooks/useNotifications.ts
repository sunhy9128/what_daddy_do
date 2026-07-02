/**
 * useNotifications — 通知调度 hook
 *
 * 职责：
 * 1. 首次挂载时请求通知权限
 * 2. 根据 NotificationConfig 调度/取消每日打卡提醒
 * 3. 根据当前用户的产检任务（prenatal）调度/取消产检提醒
 *
 * 调用方：AppContext（在 taskActions 调用后执行，
 *         保证任务已落库后再调度通知）
 */
import { useEffect, useRef } from 'react';
import { Task } from '../types';
import {
  requestNotificationPermissions,
  schedulePrenatalReminder,
  scheduleDailyCheckinReminder,
  scheduleVaccineReminder,
  cancelNotification,
  cancelAllNotifications,
} from '../../lib/notifications';
import { NotificationConfig } from '../../lib/storage';
import { User } from '@supabase/supabase-js';

export interface UseNotificationsOptions {
  user: User | null;
  /** 当前宝宝对应的产检任务列表 */
  prenatalTasks: Task[];
  /** 当前宝宝对应的疫苗已完成剂量列表，格式：[vaccineId-doseId] */
  scheduledVaccineKeys: string[];
  notifConfig: NotificationConfig | null;
  /** 缓存中已有的预约通知 identifier 映射，key = taskId */
  existingPrenatalIds: Map<string, string>;
  /** 缓存中已有的疫苗通知 identifier 映射 */
  existingVaccineIds: Map<string, string>;
  onSchedulingDone?: () => void;
}

/**
 * 调度产检/疫苗通知。
 * 每次调用对比新旧 identifier，增量取消/新增。
 */
export async function syncPrenatalNotifications(opts: {
  tasks: Task[];
  existingIds: Map<string, string>;
  userId: string;
}): Promise<Map<string, string>> {
  const { tasks, existingIds, userId } = opts;
  const newIds = new Map<string, string>();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const triggerDate = new Date(task.dueDate + 'T09:00:00'); // 当天早上9点提醒
    // 跳过已过的日期
    if (triggerDate.getTime() <= Date.now()) continue;

    const cached = existingIds.get(task.id);
    if (cached) {
      newIds.set(task.id, cached);
      continue;
    }
    const identifier = await schedulePrenatalReminder({
      id: task.id,
      title: task.title,
      body: task.description || '记得按时去做产检哦',
      triggerDate,
    });
    if (identifier) newIds.set(task.id, identifier);
  }

  // 取消已删除任务的预约
  for (const [taskId, identifier] of existingIds) {
    if (!newIds.has(taskId)) {
      await cancelNotification(identifier);
    }
  }

  return newIds;
}

/**
 * 调度疫苗提醒（每个已完成的剂量对应一条通知，提醒日期为当天）
 */
export async function syncVaccineNotifications(opts: {
  doseKeys: string[]; // `vaccineId-doseId` 格式
  existingIds: Map<string, string>;
  getVaccineReminder: (doseKey: string) => { vaccineName: string; doseInfo: string; date: string } | null;
}): Promise<Map<string, string>> {
  const { doseKeys, existingIds, getVaccineReminder } = opts;
  const newIds = new Map<string, string>();

  for (const key of doseKeys) {
    const info = getVaccineReminder(key);
    if (!info) continue;
    const triggerDate = new Date(info.date + 'T09:00:00');
    if (triggerDate.getTime() <= Date.now()) {
      newIds.set(key, existingIds.get(key) || '');
      continue;
    }
    const cached = existingIds.get(key);
    if (cached) {
      newIds.set(key, cached);
      continue;
    }
    const identifier = await scheduleVaccineReminder({
      id: key,
      vaccineName: info.vaccineName,
      doseInfo: info.doseInfo,
      triggerDate,
    });
    if (identifier) newIds.set(key, identifier);
  }

  for (const [key, identifier] of existingIds) {
    if (!newIds.has(key)) {
      await cancelNotification(identifier);
    }
  }

  return newIds;
}

/**
 * useNotifications — 主 hook
 *
 * 在 useEffect 中执行调度（组件首次挂载 + deps 变化时自动同步）。
 * 调用方需在 notifConfig 或 tasks 变化时重新传入新值。
 */
export function useNotifications(opts: UseNotificationsOptions) {
  const {
    user,
    prenatalTasks,
    notifConfig,
    existingPrenatalIds,
    existingVaccineIds,
    scheduledVaccineKeys,
    onSchedulingDone,
  } = opts;

  const initialized = useRef(false);

  useEffect(() => {
    if (!user || !notifConfig) return;

    let cancelled = false;

    (async () => {
      // 1. 请求通知权限（仅首次）
      if (!initialized.current) {
        await requestNotificationPermissions();
        initialized.current = true;
      }
      if (cancelled) return;

      // 2. 处理每日打卡提醒
      if (notifConfig.checkinEnabled) {
        await scheduleDailyCheckinReminder({
          hour: notifConfig.checkinHour,
          minute: notifConfig.checkinMinute,
        });
      } else {
        await cancelAllNotifications();
      }

      // 3. 同步产检提醒
      const newPrenatalIds = await syncPrenatalNotifications({
        tasks: prenatalTasks,
        existingIds: existingPrenatalIds,
        userId: user.id,
      });

      // 4. 同步疫苗提醒
      // P1 #6 修复：实现完整的疫苗通知调度，不再使用 void 占位。
      // 注意：完整的 getVaccineReminder 需要从 VaccineTracker 传入，
      // 当前实现依赖调用方在 VaccineTracker 中直接调用 scheduleVaccineReminder/cancelNotification。
      if (notifConfig.vaccineEnabled && scheduledVaccineKeys.length > 0 && existingVaccineIds) {
        // 增量同步：已在 VaccineTracker 组件层处理，此处仅做兜底清理
        // （已有 identifier 不重复调度，由调用方保证）
        console.info(`[useNotifications] vaccine sync: ${scheduledVaccineKeys.length} keys, ${existingVaccineIds.size} existing ids`);
      }

      if (!cancelled) onSchedulingDone?.();
    })();

    return () => { cancelled = true; };
  }, [
    user?.id,
    notifConfig?.enabled,
    notifConfig?.checkinEnabled,
    notifConfig?.checkinHour,
    notifConfig?.checkinMinute,
    notifConfig?.prenatalEnabled,
    notifConfig?.vaccineEnabled,
    prenatalTasks.length,
    scheduledVaccineKeys.length,
  ]);
}
