import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, Task } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { PregnancyStage, STAGE_LABELS } from '../../src/lib/stages';
import { getPresetTasks, PresetTask } from '../../src/lib/api';

import { Card, ProgressBar, Tag, Button } from '../../src/components/atoms';
import { TaskCard } from '../../src/components/molecules';
import { StageTabs } from '../../src/components/molecules';
import { CollapsibleGroup } from '../../src/components/organisms';
// 物品准备/心理支持已迁移到首页（index.tsx）
import { useColors } from '../../src/context/ThemeContext';
import { radius, spacing, shadows, typography } from '../../src/styles/tokens';
import { Ionicons } from '@expo/vector-icons';
import { DatePicker } from '../../src/components/DatePicker';
import * as Linking from 'expo-linking';
import { TaskCalendar } from '../../src/components/tools/TaskCalendar';

// 孕期阶段顺序（用于判断是否为已过阶段）
const STAGE_ORDER: PregnancyStage[] = ['preconception', 'first', 'second', 'third', 'postpartum'];

// 阶段标签列表（供 StageTabs 使用）
const STAGE_LABEL_LIST: string[] = Object.values(STAGE_LABELS);

// 阶段映射
const STAGE_MAP: Record<string, PregnancyStage> = {
  '备孕': 'preconception',
  '孕早期': 'first',
  '孕中期': 'second',
  '孕晚期': 'third',
  '产后': 'postpartum',
};

// 物品准备/心理支持已迁移到首页（index.tsx）

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRESET_PAGE_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const PRESET_ITEMS_PER_PAGE = 5;
const PRESET_ROW_GAP = spacing.xs;

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { state, toggleTask, addTask, removeTask, updateTask } = useApp();
  const { user } = useAuth();
  const [selectedStage, setSelectedStage] = useState(STAGE_LABELS[state.stage] || '孕晚期');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState<'checkin' | 'prenatal' | 'daily'>('daily');
  const [newTaskDate, setNewTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<'checkin' | 'prenatal' | 'daily'>('daily');
  const [editDate, setEditDate] = useState('');
  const [presetTasks, setPresetTasks] = useState<PresetTask[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [presetFilter, setPresetFilter] = useState<'all' | 'prenatal' | 'checkin' | 'daily'>('all');
  const taskBusy = useRef(false);
  const [presetPageIndex, setPresetPageIndex] = useState(0);
  const presetFlatListRef = useRef<FlatList>(null);
  const isPresetScrolling = useRef(false);
  const colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  taskScroll: { maxHeight: 280 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  titleIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.largeTitle, fontWeight: '700', color: colors.fg },
  subtitle: { ...typography.callout, color: colors.muted },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: 2,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm - 2,
  },
  viewToggleBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  viewToggleTxt: { ...typography.footnote, color: colors.muted },
  viewToggleTxtActive: { ...typography.footnote, color: colors.fg, fontWeight: '600' },
  filterToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
  },
  filterTxt: { ...typography.footnote, color: colors.muted },
  filterTxtActive: { ...typography.footnote, color: '#fff', fontWeight: '600' },
  // 可添加任务
  presetSection: {
    paddingTop: spacing.md,
  },
  presetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  presetSectionTitle: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
  },
  presetSectionCount: {
    ...typography.footnote,
    color: colors.muted,
  },
  presetFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  presetFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  presetFilterChipActive: {
    backgroundColor: colors.accent,
  },
  presetFilterTxt: { ...typography.footnote, color: colors.muted },
  presetFilterTxtActive: { ...typography.footnote, color: '#fff', fontWeight: '600' },
  presetScroll: {
    paddingHorizontal: spacing.lg,
  },
  presetCardOuter: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 160,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetCardAdd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  presetCardAddText: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '500',
    lineHeight: 20,
  },
  presetCardBody: {
    flex: 1,
  },
  presetCardTitle: {
    ...typography.callout,
    fontWeight: '500',
    color: colors.fg,
    marginBottom: 2,
  },
  presetCardDesc: {
    ...typography.footnote,
    color: colors.fgSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  // 预设任务行卡片（垂直列表）
  presetRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetRowBody: {
    flex: 1,
    marginRight: spacing.sm,
  },
  presetRowTitle: {
    ...typography.callout,
    fontWeight: '500',
    color: colors.fg,
    marginBottom: 2,
  },
  presetRowDesc: {
    ...typography.footnote,
    color: colors.fgSecondary,
  },
  presetEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  presetEmptyTxt: {
    ...typography.footnote,
    color: colors.muted,
  },
  // 可添加任务分页
  presetPagerContainer: {
    marginTop: spacing.xs,
  },
  presetPager: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  presetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  presetDotActive: {
    backgroundColor: colors.accent,
    width: 18,
  },
  presetPagerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: { ...typography.callout, fontWeight: '500', color: colors.fg },
  progressValue: { ...typography.callout, fontWeight: '600', color: colors.accent },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  fabIcon: { fontSize: 26, color: '#fff', lineHeight: 28, fontWeight: '300' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.title3,
    fontWeight: '700',
    color: colors.fg,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '600',
  },
  modalLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.fgSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    ...typography.callout,
    color: colors.fg,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // 类型选择器
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: 3,
    marginBottom: spacing.xl,
  },
  typeOption: {
    flex: 1,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: colors.accent,
  },
  typeOptionText: {
    ...typography.footnote,
    fontWeight: '500',
    color: colors.fgSecondary,
  },
  typeOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // 日期输入行
  dateInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  dateInput: {
    ...typography.callout,
    color: colors.fg,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  dateInputYear: {
    width: 80,
  },
  dateInputMonth: {
    width: 60,
  },
  dateInputDay: {
    width: 60,
  },
  dateSep: {
    ...typography.callout,
    color: colors.muted,
  },
  // 底部操作按钮组
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
  },
  // 任务详情 - 新设计
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailTitle: {
    ...typography.title2,
    fontWeight: '700',
    color: colors.fg,
    flex: 1,
  },
  detailStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  detailStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailSectionLabel: {
    ...typography.footnote,
    color: colors.fgSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  detailDesc: {
    ...typography.callout,
    color: colors.fg,
    lineHeight: 22,
    backgroundColor: colors.bg,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  detailInfoGroup: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailInfoLabel: {
    ...typography.callout,
    color: colors.muted,
  },
  detailInfoValue: {
    ...typography.callout,
    color: colors.fg,
    fontWeight: '600',
  },
  flexButton: { flex: 1, minHeight: 44, borderRadius: radius.sm },
  deleteButton: { backgroundColor: colors.error },
  actionButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  readOnlyNotice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
  },
  readOnlyNoticeText: {
    ...typography.footnote,
    color: colors.muted,
  },

}), [colors]);

  // 根据任务标题自动分类（产后阶段不返回 prenatal）
  const detectTaskType = (title: string): 'prenatal' | 'daily' | 'checkin' => {
    const prenatalKeywords = ['产检', '检查', '筛查', 'B超', '胎心', '唐筛', '糖耐', '四维', 'NT', '彩超', '大排畸', '小排畸', '血常规', '尿常规'];
    const checkinKeywords = ['打卡'];
    const dailyKeywords = ['每天', '每日', '运动', '散步', '喝水', '体重', '血压', '血糖', '测', '量', '记录'];
    if (currentStageKey !== 'postpartum') {
      for (const kw of prenatalKeywords) { if (title.includes(kw)) return 'prenatal'; }
    }
    for (const kw of checkinKeywords) { if (title.includes(kw)) return 'checkin'; }
    for (const kw of dailyKeywords) { if (title.includes(kw)) return 'daily'; }
    return 'daily';
  };

  const safeAlert = useCallback((title: string, msg?: string) => {
    if (Platform.OS === 'web') { window.alert(msg || title); }
    else { Alert.alert(title, msg || ''); }
  }, []);

  const TASK_TYPE_OPTIONS = [
    { value: 'checkin', label: '每日打卡', color: colors.accent },
    { value: 'prenatal', label: '产检任务', color: colors.accent },
    { value: 'daily', label: '日常任务', color: colors.accent },
  ] as const;

  // 当自动计算的孕期变化时，同步切换
  useEffect(() => {
    const label = STAGE_LABELS[state.stage];
    if (label) {
      setSelectedStage(label);
    }
  }, [state.stage]);

  // 加载预设任务
  useEffect(() => {
    loadPresetTasks();
  }, []);



  async function loadPresetTasks() {
    setLoadingPresets(true);
    try {
      const tasks = await getPresetTasks();
      setPresetTasks(tasks);
    } catch (error) {
      // 静默处理，退出登录后请求会 401
    } finally {
      setLoadingPresets(false);
    }
  }

  const currentStageKey = STAGE_MAP[selectedStage] || 'third';

  // 判断任务是否为已过阶段（当前阶段之前）
  const currentStageIndex = STAGE_ORDER.indexOf(state.stage);
  const isPastStage = currentStageIndex > 0 && STAGE_ORDER.indexOf(currentStageKey as PregnancyStage) < currentStageIndex;
  const isPastStageTask = (taskStage: string) => {
    const taskIndex = STAGE_ORDER.indexOf(taskStage as PregnancyStage);
    return taskIndex >= 0 && taskIndex < currentStageIndex;
  };

  // 当前阶段的所有任务
  const filteredTasks = state.tasks.filter(t => t.stage === currentStageKey);

  // 进度只统计当前阶段的一次性任务（排除日常/打卡等重复任务）
  const oneTimeTasks = filteredTasks.filter(t => t.type !== 'daily' && t.type !== 'checkin' && t.taskSubtype !== 'recurring');
  const totalTasks = oneTimeTasks.length;
  const completedTasks = oneTimeTasks.filter(t => t.isCompleted).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 当前阶段的产检任务（一次性任务）
  const prenatalTasks = filteredTasks.filter(t => t.type === 'prenatal');

  // 当前阶段的日常任务（重复任务）
  const dailyTasks = filteredTasks.filter(t => t.type === 'daily');

  // 自定义任务分组已合并到日常/产检/打卡中

  // 当前阶段的日打卡任务
  const checkinTasks = filteredTasks.filter(t => t.type === 'checkin');

  // 各列表是否可见（无待办时隐藏）
  const showPrenatal = currentStageKey !== 'postpartum' && prenatalTasks.length > 0;
  const showCheckin = checkinTasks.length > 0;
  const showDaily = dailyTasks.length > 0;
  // 排在前面的有实际内容的列表默认展开
  const firstVisible =
    (showPrenatal && 'prenatal') ||
    (showCheckin && 'checkin') ||
    (showDaily && 'daily') ||
    null;

  // 获取当前阶段的预设任务（去重）
  const presetsForStage = presetTasks.filter(p => p.stage === currentStageKey);
  const existingTitles = filteredTasks.map(t => t.title);
  const availablePresets = presetsForStage.filter(p => !existingTitles.includes(p.title));
  const filteredAvailablePresets = presetFilter === 'all'
    ? availablePresets
    : availablePresets.filter(p => p.type === presetFilter);

  // 获取该任务所在阶段之前的所有产检中最晚的日期（作为最小允许日期）
  const getMinPrenatalDate = useCallback((stage: string, excludeTaskId?: string) => {
    const currentIdx = STAGE_ORDER.indexOf(stage as PregnancyStage);
    if (currentIdx <= 0) return '';
    const earlier = state.tasks
      .filter(t => t.type === 'prenatal' && t.dueDate && t.id !== excludeTaskId)
      .filter(t => STAGE_ORDER.indexOf(t.stage as PregnancyStage) < currentIdx)
      .map(t => t.dueDate!);
    if (earlier.length === 0) return '';
    return earlier.reduce((max, d) => d > max ? d : max, earlier[0]);
  }, [state.tasks]);

  const handleAddPreset = async (task: PresetTask) => {
    if (taskBusy.current) return;
    taskBusy.current = true;
    try {
      await addTask({
        title: task.title,
        description: task.description,
        stage: currentStageKey,
        type: task.type,
        dueDate: task.due_date,
      });
      safeAlert('成功', `已添加"${task.title}"`);
    } catch (error: any) {
      safeAlert('错误', error.message);
    } finally {
      taskBusy.current = false;
    }
  };

  const handleAddCustom = async () => {
    if (!newTaskTitle.trim()) {
      safeAlert('错误', '请输入任务标题');
      return;
    }
    setSavingTask(true);
    const detectedType = detectTaskType(newTaskTitle.trim());
    // 构建日期
    let dueDate: string | undefined;
    if (newTaskDate) {
      dueDate = newTaskDate;
    }
    try {
      await addTask({
        title: newTaskTitle.trim(),
        stage: currentStageKey,
        type: detectedType,
        description: newTaskDesc.trim() || undefined,
        ...(dueDate ? { dueDate } : {}),
      });
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDate(new Date().toISOString().split('T')[0]);
      setShowAddModal(false);
      const typeLabelMap: Record<string, string> = { prenatal: '产检', daily: '日常', checkin: '打卡' };
      safeAlert('成功', `任务已添加（${typeLabelMap[detectedType] || '日常'}）`);
    } catch (error: any) {
      safeAlert('错误', error.message);
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!taskId || taskBusy.current) return;
    taskBusy.current = true;
    try {
      await removeTask(taskId);
      setIsEditMode(false);
      setShowInfoModal(false);
    } catch (error: any) {
      safeAlert('错误', error.message);
    } finally {
      taskBusy.current = false;
    }
  };

  const handleInfoPress = (task: Task) => {
    setSelectedTask(task);
    setIsEditMode(false);
    setShowInfoModal(true);
  };

  const handleNavigateToHospital = useCallback(() => {
    const currentBaby = state.babies.find(b => b.id === state.currentBabyId);
    const hName = currentBaby?.hospitalName;
    const hLoc = currentBaby?.hospitalLocation;
    let hAddr = '';
    let hLat: number | undefined;
    let hLng: number | undefined;
    if (hLoc) {
      try {
        const parsed = JSON.parse(hLoc);
        hAddr = parsed.address || '';
        hLat = parsed.lat;
        hLng = parsed.lng;
      } catch {}
    }
    if (!hName && !hAddr) return;

    const encoded = encodeURIComponent(hAddr);
    const url = hLat != null && hLng != null
      ? (Platform.OS === 'ios'
        ? `https://maps.apple.com/?ll=${hLat},${hLng}&q=${encoded}`
        : `https://maps.google.com/?q=${hLat},${hLng}`)
      : (Platform.OS === 'ios'
        ? `https://maps.apple.com/?q=${encoded}`
        : `https://maps.google.com/?q=${encoded}`);
    Linking.openURL(url);
  }, [state.babies, state.currentBabyId]);

  const handleEditTask = () => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setEditDesc(selectedTask.description || '');
      setEditType(selectedTask.type as 'checkin' | 'prenatal' | 'daily');
      setEditDate(selectedTask.dueDate || new Date().toISOString().split('T')[0]);
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = async () => {
    if (taskBusy.current) return;
    if (!editTitle.trim()) {
      safeAlert('错误', '请输入任务标题');
      return;
    }
    if (!selectedTask) return;
    // 产检任务日期校验：不能早于前面阶段的最晚产检日期
    if (selectedTask.type === 'prenatal' && editDate) {
      const minDate = getMinPrenatalDate(selectedTask.stage, selectedTask.id);
      if (minDate && editDate < minDate) {
        safeAlert('日期无效', `该产检的预约日期不能早于 ${minDate}（前面阶段的产检日期）`);
        return;
      }
    }
    taskBusy.current = true;
    try {
      const editUpdates: { title: string; type: 'checkin' | 'prenatal' | 'daily'; description?: string; dueDate?: string } = {
        title: editTitle.trim(),
        type: editType,
        description: editDesc.trim() || undefined,
      };
      if (editDate) {
        editUpdates.dueDate = editDate;
      }
      await updateTask(selectedTask.id, editUpdates);
      setIsEditMode(false);
      setShowInfoModal(false);
    } catch (error: any) {
      safeAlert('错误', error.message);
    } finally {
      taskBusy.current = false;
    }
  };

  const TASK_TYPE_LABELS: Record<string, string> = {
    prenatal: '产检任务',
    daily: '日常任务',
    // custom 已合并到日常/产检/打卡中
    checkin: '每日打卡',
  };

  // 计算预设任务总页数（每页放2个卡片）
  const PRESET_ITEMS_PER_PAGE = 2;
  const totalPresetPages = Math.ceil(filteredAvailablePresets.length / PRESET_ITEMS_PER_PAGE) || 1;

  // 分页滑动到指定页
  const scrollToPresetPage = useCallback((index: number) => {
    if (index < 0 || index >= totalPresetPages) return;
    isPresetScrolling.current = true;
    setPresetPageIndex(index);
    presetFlatListRef.current?.scrollToIndex({ index, animated: true });
    setTimeout(() => { isPresetScrolling.current = false; }, 600);
  }, [totalPresetPages]);

  // FlatList 可见项变化检测（更新指示器）
  const onPresetViewable = useCallback(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (isPresetScrolling.current) return;
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setPresetPageIndex(viewableItems[0].index);
    }
  }, []);

  const presetViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // 预设任务分页数据（每页5个任务，垂直排列）
  const presetPageData = useMemo(() => {
    const pages: PresetTask[][] = [];
    for (let i = 0; i < filteredAvailablePresets.length; i += PRESET_ITEMS_PER_PAGE) {
      pages.push(filteredAvailablePresets.slice(i, i + PRESET_ITEMS_PER_PAGE));
    }
    return pages;
  }, [filteredAvailablePresets]);

  if (loadingPresets) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="checkbox-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.title}>待办清单</Text>
          </View>
          <Text style={styles.subtitle}>当前阶段：{selectedStage}</Text>
          {/* 视图切换 */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={14} color={viewMode === 'list' ? colors.accent : colors.muted} />
              <Text style={viewMode === 'list' ? styles.viewToggleTxtActive : styles.viewToggleTxt}>列表</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'calendar' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('calendar')}
            >
              <Ionicons name="calendar-outline" size={14} color={viewMode === 'calendar' ? colors.accent : colors.muted} />
              <Text style={viewMode === 'calendar' ? styles.viewToggleTxtActive : styles.viewToggleTxt}>日历</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 日历视图 */}
        {viewMode === 'calendar' && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <TaskCalendar userId={user?.id || ''} expanded />
          </View>
        )}

        {/* Stage Tabs */}
        {viewMode === 'list' && ( <>
        <StageTabs
          stages={STAGE_LABEL_LIST}
          activeStage={selectedStage}
          onStageChange={setSelectedStage}
        />

        {/* Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{selectedStage}完成进度</Text>
            <Text style={styles.progressValue}>{completedTasks}/{totalTasks}</Text>
          </View>
          <ProgressBar value={progress} />
        </Card>

        {/* 产检任务 — 产后阶段不显示；无待办时隐藏 */}
        {currentStageKey !== 'postpartum' && prenatalTasks.length > 0 && (
          <CollapsibleGroup title="产检任务" count={prenatalTasks.length} defaultExpanded={firstVisible === 'prenatal'}>
            <ScrollView style={styles.taskScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {prenatalTasks.map(task => (
                <TaskCard key={task.id} title={task.title} description={task.description} type={task.type} dueDate={task.dueDate} isCompleted={task.isCompleted} dailyCount={0} onToggle={isPastStageTask(task.stage) ? undefined : () => toggleTask(task.id)} onInfo={() => handleInfoPress(task)} onNavigate={handleNavigateToHospital} onDelete={isPastStageTask(task.stage) ? undefined : () => handleDeleteTask(task.id)} readOnly={isPastStageTask(task.stage)} />
              ))}
            </ScrollView>
          </CollapsibleGroup>
        )}

        {/* 每日打卡 — 无待办时隐藏 */}
        {checkinTasks.length > 0 && (
          <CollapsibleGroup title="每日打卡" count={checkinTasks.length} defaultExpanded={firstVisible === 'checkin'}>
            <ScrollView style={styles.taskScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {checkinTasks.map(task => (
                <TaskCard key={task.id} title={task.title} description={task.description} type={task.type} dueDate={task.dueDate} isCompleted={task.isCompleted} dailyCount={task.dailyCount} streakCount={task.streakCount} onToggle={isPastStageTask(task.stage) ? undefined : () => toggleTask(task.id)} onInfo={() => handleInfoPress(task)} onDelete={isPastStageTask(task.stage) ? undefined : () => handleDeleteTask(task.id)} readOnly={isPastStageTask(task.stage)} />
              ))}
            </ScrollView>
          </CollapsibleGroup>
        )}

        {/* 日常任务 — 无待办时隐藏 */}
        {dailyTasks.length > 0 && (
          <CollapsibleGroup title="日常任务" count={dailyTasks.length} defaultExpanded={firstVisible === 'daily'}>
            <ScrollView style={styles.taskScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {dailyTasks.map(task => (
                <TaskCard key={task.id} title={task.title} description={task.description} type={task.type} dueDate={task.dueDate} isCompleted={false} dailyCount={task.dailyCount} onToggle={isPastStageTask(task.stage) ? undefined : () => toggleTask(task.id)} onInfo={() => handleInfoPress(task)} onDelete={isPastStageTask(task.stage) ? undefined : () => handleDeleteTask(task.id)} readOnly={isPastStageTask(task.stage)} />
              ))}
            </ScrollView>
          </CollapsibleGroup>
        )}





        {/* 可添加的预设任务 — 过去阶段隐藏；无可添加时隐藏 */}
        {!isPastStage && availablePresets.length > 0 && (
        <View style={styles.presetSection}>
          {/* 标题行 */}
          <View style={styles.presetSectionHeader}>
            <Text style={styles.presetSectionTitle}>可添加任务</Text>
            <Text style={styles.presetSectionCount}>{filteredAvailablePresets.length} 项</Text>
          </View>

          {/* 类型筛选 */}
          <View style={styles.presetFilterRow}>
            {(['all', 'prenatal', 'checkin', 'daily'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.presetFilterChip, presetFilter === f && styles.presetFilterChipActive]}
                onPress={() => setPresetFilter(f)}
              >
                <Text style={presetFilter === f ? styles.presetFilterTxtActive : styles.presetFilterTxt}>
                  {f === 'all' ? '全部' : f === 'prenatal' ? '产检' : f === 'checkin' ? '打卡' : '日常'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 分页滑动卡片（每页5条垂直列表） */}
          {filteredAvailablePresets.length > 0 ? (
            <>
              <FlatList
                ref={presetFlatListRef}
                data={presetPageData}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => `preset-page-${index}`}
                onViewableItemsChanged={onPresetViewable}
                viewabilityConfig={presetViewabilityConfig}
                getItemLayout={(_, index) => ({ length: PRESET_PAGE_WIDTH, offset: PRESET_PAGE_WIDTH * index, index })}
                style={{ height: 320 }}
                renderItem={({ item: pageTasks }) => (
                  <View style={{ width: PRESET_PAGE_WIDTH, paddingHorizontal: spacing.lg }}>
                    {pageTasks.map((task: PresetTask) => (
                      <TouchableOpacity
                        key={task.id}
                        style={[styles.presetRowCard, pageTasks.indexOf(task) < pageTasks.length - 1 && { marginBottom: PRESET_ROW_GAP }]}
                        onPress={() => handleAddPreset(task)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.presetCardAdd}>
                          <Text style={styles.presetCardAddText}>+</Text>
                        </View>
                        <View style={styles.presetRowBody}>
                          <Text style={styles.presetRowTitle} numberOfLines={1}>{task.title}</Text>
                          <Text style={styles.presetRowDesc} numberOfLines={1}>{task.description}</Text>
                        </View>
                        <Tag
                          label={task.type === 'prenatal' ? '产检' : task.type === 'checkin' ? '日打卡' : '日常'}
                          variant={task.type === 'prenatal' ? 'short' : 'long'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {/* 分页指示器 */}
              <View style={styles.presetPager}>
                <TouchableOpacity
                  style={[styles.presetPagerBtn, presetPageIndex === 0 && { opacity: 0.4 }]}
                  onPress={() => scrollToPresetPage(presetPageIndex - 1)}
                  disabled={presetPageIndex === 0}
                >
                  <Ionicons name="chevron-back" size={14} color={colors.fg} />
                </TouchableOpacity>
                {Array.from({ length: totalPresetPages }).map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.presetDot, idx === presetPageIndex && styles.presetDotActive]}
                  />
                ))}
                <TouchableOpacity
                  style={[styles.presetPagerBtn, presetPageIndex >= totalPresetPages - 1 && { opacity: 0.4 }]}
                  onPress={() => scrollToPresetPage(presetPageIndex + 1)}
                  disabled={presetPageIndex >= totalPresetPages - 1}
                >
                  <Ionicons name="chevron-forward" size={14} color={colors.fg} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.presetEmpty}>
              <Ionicons name="checkmark-circle" size={16} color={colors.muted} />
              <Text style={styles.presetEmptyTxt}>该类型任务已全部添加</Text>
            </View>
          )}
        </View>
        )}
        </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — 添加任务（过去阶段隐藏） */}
      {!isPastStage && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Custom Task Modal */}
      <Modal visible={showAddModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 头部 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加任务</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAddModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color={colors.fgSecondary} />
              </TouchableOpacity>
            </View>

            {/* 任务标题 */}
            <Text style={styles.modalLabel}>任务标题</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="如：准备待产包"
              placeholderTextColor={colors.muted}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />

            {/* 任务类型选择 */}
            <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>任务类型</Text>
            <View style={styles.typeSelector}>
              {TASK_TYPE_OPTIONS
                .filter(opt => !(currentStageKey === 'postpartum' && opt.value === 'prenatal'))
                .map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeOption,
                    newTaskType === option.value && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewTaskType(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      newTaskType === option.value && styles.typeOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 预约日期 */}
            <Text style={styles.modalLabel}>预约日期</Text>
            <DatePicker
              value={newTaskDate}
              onChange={setNewTaskDate}
              minDate={getMinPrenatalDate(currentStageKey)}
              label="预约日期"
            />

            {/* 温馨提示（仅产检任务） */}
            {newTaskType === 'prenatal' && (
              <>
                <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>温馨提示</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="填写注意事项，如：需空腹、携带身份证/医保卡……"
                  placeholderTextColor={colors.muted}
                  value={newTaskDesc}
                  onChangeText={setNewTaskDesc}
                  multiline
                />
              </>
            )}

            {/* 底部操作区 */}
            <View style={styles.modalActions}>
              <Button title="取消" variant="ghost" onPress={() => setShowAddModal(false)} style={styles.modalActionBtn} />
              <View style={{ width: spacing.md }} />
              <Button title="保存" variant="primary" onPress={handleAddCustom} loading={savingTask} style={styles.modalActionBtn} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Info Modal */}
      <Modal visible={showInfoModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? '编辑任务' : '任务详情'}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setShowInfoModal(false); setIsEditMode(false); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color={colors.fgSecondary} />
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <View>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="任务标题"
                      placeholderTextColor={colors.muted}
                      value={editTitle}
                      onChangeText={setEditTitle}
                    />
                    <View style={styles.typeSelector}>
                      {TASK_TYPE_OPTIONS
                        .filter(opt => !(currentStageKey === 'postpartum' && opt.value === 'prenatal'))
                        .map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.typeOption,
                            editType === option.value && styles.typeOptionActive,
                          ]}
                          onPress={() => setEditType(option.value as 'checkin' | 'prenatal' | 'daily')}
                        >
                          <Text
                            style={[
                              styles.typeOptionText,
                              editType === option.value && styles.typeOptionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* 预约日期 */}
                    <Text style={styles.modalLabel}>预约日期</Text>
                    <DatePicker
                      value={editDate}
                      onChange={setEditDate}
                      minDate={getMinPrenatalDate(selectedTask?.stage || currentStageKey, selectedTask?.id)}
                      label="预约日期"
                    />

                    {/* 温馨提示 */}
                    {editType === 'prenatal' && (
                      <>
                        <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>温馨提示</Text>
                        <TextInput
                          style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                          placeholder="填写注意事项，如：需空腹、携带身份证/医保卡……"
                          placeholderTextColor={colors.muted}
                          value={editDesc}
                          onChangeText={setEditDesc}
                          multiline
                        />
                      </>
                    )}

                    <Button title="保存" variant="primary" onPress={handleSaveEdit} />
                  </>
                ) : (
                  <>
                  <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                    {/* 任务标题 + 完成状态 */}
                    <View style={styles.detailHeader}>
                      <Text style={styles.detailTitle}>{selectedTask.title}</Text>
                      {(!(selectedTask.type === 'daily') || selectedTask.isCompleted) && (
                        <View style={[styles.detailStatusBadge, { backgroundColor: selectedTask.isCompleted ? colors.success + '20' : colors.surfaceSecondary }]}>
                          <Text style={[styles.detailStatusText, { color: selectedTask.isCompleted ? colors.success : colors.muted }]}>
                            {selectedTask.isCompleted ? '✓ 已完成' : '待完成'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 类型标签 */}
                    <View style={styles.detailTagRow}>
                      <Tag label={TASK_TYPE_LABELS[selectedTask.type] || selectedTask.type} variant={selectedTask.type === 'prenatal' ? 'short' : 'long'} />
                    </View>

                    {/* 描述 — 单独区块 */}
                    {selectedTask.description ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionLabel}>任务描述</Text>
                        <Text style={styles.detailDesc}>{selectedTask.description}</Text>
                      </View>
                    ) : null}

                    {/* 信息行 */}
                    <View style={styles.detailInfoGroup}>
                      <View style={styles.detailInfoRow}>
                        <Text style={styles.detailInfoLabel}>截止日期</Text>
                        <Text style={[styles.detailInfoValue, !selectedTask.dueDate && { color: colors.muted }]}>
                          {selectedTask.dueDate || '未预约'}
                        </Text>
                      </View>
                      {selectedTask.type === 'checkin' && (
                        <View style={styles.detailInfoRow}>
                          <Text style={styles.detailInfoLabel}>连续打卡</Text>
                          <Text style={styles.detailInfoValue}>{selectedTask.streakCount} 天</Text>
                        </View>
                      )}
                      {selectedTask.type === 'daily' && (
                        <View style={styles.detailInfoRow}>
                          <Text style={styles.detailInfoLabel}>今日完成</Text>
                          <Text style={styles.detailInfoValue}>{selectedTask.dailyCount} 次</Text>
                        </View>
                      )}
                    </View>

                    {/* 产检医院信息（仅产检任务） */}
                    {selectedTask.type === 'prenatal' && (() => {
                      const currentBaby = state.babies.find(b => b.id === state.currentBabyId);
                      const hName = currentBaby?.hospitalName;
                      const hLoc = currentBaby?.hospitalLocation;
                      let hAddr = '';
                      if (hLoc) {
                        try {
                          const parsed = JSON.parse(hLoc);
                          hAddr = parsed.address || '';
                        } catch {}
                      }
                      if (!hName && !hAddr) return null;
                      return (
                        <View style={[styles.detailSection, { marginTop: spacing.sm }]}>
                          <View style={styles.detailInfoGroup}>
                            {hName && (
                              <View style={styles.detailInfoRow}>
                                <Text style={styles.detailInfoLabel}><Ionicons name="medkit-outline" size={16} color={colors.fgSecondary} /> 产检医院</Text>
                                <Text style={styles.detailInfoValue}>{hName}</Text>
                              </View>
                            )}
                            {hAddr && (
                              <View style={styles.detailInfoRow}>
                                <Text style={styles.detailInfoLabel}><Ionicons name="location-outline" size={16} color={colors.fgSecondary} /> 地址</Text>
                                <Text style={[styles.detailInfoValue, { fontSize: 13 }]} numberOfLines={2}>{hAddr}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })()}

                  </ScrollView>

                    {/* 操作按钮 */}
                    <View style={styles.actionButtons}>
                      {isPastStageTask(selectedTask.stage) ? (
                        <View style={styles.readOnlyNotice}>
                          <Ionicons name="lock-closed-outline" size={16} color={colors.muted} style={{ marginRight: 6 }} />
                          <Text style={styles.readOnlyNoticeText}>此阶段任务仅可查看</Text>
                        </View>
                      ) : (
                        <>
                          <Button title="编辑" variant="primary" style={styles.flexButton} onPress={handleEditTask} />
                          <Button title="删除" variant="primary" style={{ ...styles.flexButton, ...styles.deleteButton }} onPress={() => handleDeleteTask(selectedTask.id)} />
                        </>
                      )}
                    </View>
                    </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
