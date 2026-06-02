import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, Task } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { PregnancyStage, STAGES, STAGE_LABELS } from '../../src/lib/stages';
import { getPresetTasks, PresetTask } from '../../src/lib/api';

import { Card, ProgressBar, Tag, Button } from '../../src/components/atoms';
import { TaskCard } from '../../src/components/molecules';
import { StageTabs } from '../../src/components/molecules';
import { CollapsibleGroup } from '../../src/components/organisms';
// 物品准备/心理支持已迁移到首页（index.tsx）
import { colors, radius, spacing, shadows, typography } from '../../src/styles/tokens';

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



export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { state, toggleTask, addTask, removeTask, updateTask } = useApp();
  const { user } = useAuth();
  const [selectedStage, setSelectedStage] = useState(STAGE_LABELS[state.stage] || '孕晚期');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'checkin' | 'prenatal' | 'daily'>('daily');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<'checkin' | 'prenatal' | 'daily'>('daily');
  const [presetTasks, setPresetTasks] = useState<PresetTask[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [savingTask, setSavingTask] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const taskBusy = useRef(false);



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

  const getTypeStyle = (type: string) => {
    const opt = TASK_TYPE_OPTIONS.find(o => o.value === type);
    return opt ? { color: opt.color } : {};
  };

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
  // 进度只统计一次性任务（排除日常/打卡等重复任务）
  const oneTimeTasks = state.tasks.filter(t => t.type !== 'daily' && t.type !== 'checkin' && t.taskSubtype !== 'recurring');
  const totalTasks = oneTimeTasks.length;
  const completedTasks = oneTimeTasks.filter(t => t.isCompleted).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 当前阶段的所有任务
  const filteredTasks = state.tasks.filter(t => t.stage === currentStageKey);

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
    try {
      await addTask({
        title: newTaskTitle.trim(),
        stage: currentStageKey,
        type: detectedType,
      });
      setNewTaskTitle('');
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

  const handleEditTask = () => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setEditType(selectedTask.type as 'checkin' | 'prenatal' | 'daily');
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
    taskBusy.current = true;
    try {
      await updateTask(selectedTask.id, { title: editTitle.trim(), type: editType });
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
          <Text style={styles.title}>待办清单</Text>
          <Text style={styles.subtitle}>当前阶段：{selectedStage}</Text>
        </View>

        {/* Stage Tabs */}
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
                <TaskCard key={task.id} title={task.title} type={task.type} dueDate={task.dueDate} isCompleted={task.isCompleted} dailyCount={0} onToggle={() => toggleTask(task.id)} onInfo={() => handleInfoPress(task)} onDelete={() => handleDeleteTask(task.id)} />
              ))}
            </ScrollView>
          </CollapsibleGroup>
        )}

        {/* 每日打卡 — 无待办时隐藏 */}
        {checkinTasks.length > 0 && (
          <CollapsibleGroup title="每日打卡" count={checkinTasks.length} defaultExpanded={firstVisible === 'checkin'}>
            <ScrollView style={styles.taskScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {checkinTasks.map(task => (
                <TaskCard key={task.id} title={task.title} type={task.type} dueDate={task.dueDate} isCompleted={task.isCompleted} dailyCount={task.dailyCount} streakCount={task.streakCount} onToggle={() => toggleTask(task.id)} onInfo={() => handleInfoPress(task)} onDelete={() => handleDeleteTask(task.id)} />
              ))}
            </ScrollView>
          </CollapsibleGroup>
        )}

        {/* 日常任务 — 无待办时隐藏 */}
        {dailyTasks.length > 0 && (
          <CollapsibleGroup title="日常任务" count={dailyTasks.length} defaultExpanded={firstVisible === 'daily'}>
            <ScrollView style={styles.taskScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {dailyTasks.map(task => (
                <TaskCard key={task.id} title={task.title} type={task.type} dueDate={task.dueDate} isCompleted={false} dailyCount={task.dailyCount} onToggle={() => toggleTask(task.id)} onInfo={() => handleInfoPress(task)} onDelete={() => handleDeleteTask(task.id)} />
              ))}
            </ScrollView>
          </CollapsibleGroup>
        )}





        {/* 可添加的预设任务 — 无可添加时隐藏 */}
        {availablePresets.length > 0 && (
        <View style={styles.presetGroup}>
          <TouchableOpacity style={styles.presetGroupHeader} onPress={() => setShowPresets(!showPresets)} activeOpacity={0.7}>
            <View style={styles.presetGroupTitleRow}>
              <Text style={styles.presetGroupTitle}>可添加任务</Text>
              <View style={styles.presetGroupBadge}>
                <Text style={styles.presetGroupBadgeText}>{availablePresets.length}</Text>
              </View>
            </View>
            <Text style={styles.presetGroupArrow}>{showPresets ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showPresets && (
            <View style={styles.presetGroupContent}>
              <ScrollView style={styles.taskScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {availablePresets.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.presetItem}
                    onPress={() => handleAddPreset(task)}
                  >
                    <View style={styles.presetIcon}>
                      <Text style={styles.presetIconText}>+</Text>
                    </View>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetTitle}>{task.title}</Text>
                      <Text style={styles.presetDesc}>{task.description}</Text>
                      <Tag
                        label={task.type === 'prenatal' ? '产检' : task.type === 'checkin' ? '日打卡' : '日常'}
                        variant={task.type === 'prenatal' ? 'short' : 'long'}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — 添加任务 */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Custom Task Modal */}
      <Modal visible={showAddModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 头部 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加任务</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAddModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.modalCloseIcon}>✕</Text>
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
                <Text style={styles.modalCloseIcon}>✕</Text>
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
                    <Button title="保存" variant="primary" onPress={handleSaveEdit} />
                  </>
                ) : (
                  <>
                    <Text style={styles.infoTitle}>{selectedTask.title}</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>类型</Text>
                      <Text style={styles.infoValue}>{TASK_TYPE_LABELS[selectedTask.type] || selectedTask.type}</Text>
                    </View>
                    {selectedTask.description && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>描述</Text>
                        <Text style={styles.infoValue}>{selectedTask.description}</Text>
                      </View>
                    )}
                    {selectedTask.dueDate && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>截止日期</Text>
                        <Text style={styles.infoValue}>{selectedTask.dueDate}</Text>
                      </View>
                    )}
                    {selectedTask.type === 'checkin' && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>连续打卡</Text>
                        <Text style={styles.infoValue}>{selectedTask.streakCount} 天</Text>
                      </View>
                    )}

                    <View style={styles.actionButtons}>
                      <Button title="编辑" variant="primary" style={styles.flexButton} onPress={handleEditTask} />
                      <Button title="删除" variant="primary" style={{ ...styles.flexButton, ...styles.deleteButton }} onPress={() => handleDeleteTask(selectedTask.id)} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  taskScroll: { maxHeight: 280 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title: { ...typography.largeTitle, fontWeight: '700', color: colors.fg },
  subtitle: { ...typography.callout, color: colors.muted, marginTop: spacing.xs },
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
  // 可添加任务分组
  presetGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  presetGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  presetGroupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  presetGroupTitle: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
  },
  presetGroupBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  presetGroupBadgeText: {
    ...typography.footnote,
    fontWeight: '600',
    color: '#fff',
  },
  presetGroupArrow: {
    fontSize: 16,
    color: colors.muted,
  },
  presetGroupContent: {
    paddingHorizontal: spacing.sm,
  },
  emptyText: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  presetIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  presetIconText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  presetInfo: { flex: 1 },
  presetTitle: { ...typography.callout, fontWeight: '500', color: colors.fg, marginBottom: 2 },
  presetDesc: { ...typography.footnote, color: colors.fgSecondary, lineHeight: 18 },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    borderRadius: 16,
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
    borderRadius: 7,
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
  // 任务详情
  infoTitle: {
    ...typography.title3,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.callout,
    color: colors.muted,
  },
  infoValue: {
    ...typography.callout,
    color: colors.fg,
    fontWeight: '500',
  },
  flexButton: { flex: 1, minHeight: 44, borderRadius: radius.sm },
  deleteButton: { backgroundColor: colors.error },
  actionButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },

});