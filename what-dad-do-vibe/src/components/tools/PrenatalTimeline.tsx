import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { useApp, Task } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import {
  loadPrenatalCheckupRecords, savePrenatalCheckupRecords,
  PrenatalCheckupRecord,
} from '../../lib/storage';

const STAGE_ORDER = ['first', 'second', 'third'] as const;
const FULL_STAGE_ORDER = ['preconception', 'first', 'second', 'third', 'postpartum'];
const STAGE_LABELS: Record<string, string> = { first: '孕早期', second: '孕中期', third: '孕晚期' };

// ─── 产检报告辅助 ───
const BP_CATEGORIES = [
  { label: '正常', systolic: [90, 120], diastolic: [60, 80] },
  { label: '偏高', systolic: [120, 140], diastolic: [80, 90] },
  { label: '偏高（需关注）', systolic: [140, 999], diastolic: [90, 999] },
] as const;

function getBPCategory(systolic?: number, diastolic?: number): string {
  if (!systolic || !diastolic) return '';
  for (const cat of BP_CATEGORIES) {
    if (systolic >= cat.systolic[0] && systolic < cat.systolic[1] &&
        diastolic >= cat.diastolic[0] && diastolic < cat.diastolic[1]) {
      return cat.label;
    }
  }
  return '';
}

const URINE_PROTEIN_OPTIONS = ['阴性', '±', '1+', '2+', '3+', '未测'];

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PrenatalTimeline({ userId, expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { state, toggleTask } = useApp();

  // ─── 检查报告数据 ───
  const [checkups, setCheckups] = useState<PrenatalCheckupRecord[]>([]);
  const [checkupsLoading, setCheckupsLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PrenatalCheckupRecord>>({});

  useEffect(() => {
    if (!userId) { setCheckupsLoading(false); return; }
    (async () => {
      try {
        const data = await loadPrenatalCheckupRecords(userId, state.currentBabyId!);
        setCheckups(data);
      } catch (e) {
        console.error('loadPrenatalCheckupRecords error:', e);
      } finally {
        setCheckupsLoading(false);
      }
    })();
  }, [userId]);

  const persistCheckups = useCallback((data: PrenatalCheckupRecord[]) => {
    setCheckups(data);
    savePrenatalCheckupRecords(userId, state.currentBabyId!, data);
  }, [userId]);

  const getCheckupForTask = useCallback((taskId: string) => checkups.find(c => c.taskId === taskId), [checkups]);

  const handleStartEdit = (taskId: string, existing?: PrenatalCheckupRecord) => {
    setEditingTaskId(taskId);
    if (existing) {
      setFormData({ ...existing });
    } else {
      setFormData({
        date: getTodayStr(),
        week: state.weeksPregnant,
        systolicBP: undefined,
        diastolicBP: undefined,
        weight: undefined,
        fetalHeartRate: undefined,
        urineProtein: undefined,
        fundalHeight: undefined,
        notes: '',
      });
    }
  };

  const handleSaveCheckup = () => {
    if (!editingTaskId || !formData.date) return;
    const existing = checkups.find(c => c.taskId === editingTaskId);
    let newCheckups: PrenatalCheckupRecord[];
    if (existing) {
      newCheckups = checkups.map(c =>
        c.taskId === editingTaskId
          ? { ...c, ...formData, id: c.id, taskId: editingTaskId, createdAt: new Date().toISOString() }
          : c
      );
    } else {
      const record: PrenatalCheckupRecord = {
        id: generateId(),
        taskId: editingTaskId,
        date: formData.date || getTodayStr(),
        week: formData.week || state.weeksPregnant,
        systolicBP: formData.systolicBP,
        diastolicBP: formData.diastolicBP,
        weight: formData.weight,
        fetalHeartRate: formData.fetalHeartRate,
        urineProtein: formData.urineProtein,
        fundalHeight: formData.fundalHeight,
        notes: formData.notes || '',
        createdAt: new Date().toISOString(),
      };
      newCheckups = [...checkups, record];
    }
    persistCheckups(newCheckups);
    setEditingTaskId(null);
    setFormData({});
  };

  const handleDeleteCheckup = (taskId: string) => {
    const filtered = checkups.filter(c => c.taskId !== taskId);
    setCheckups(filtered);
    persistCheckups(filtered);
  };

  // ─── 时间轴主体 ───
  const STAGE_COLORS: Record<string, string> = {
    first: colors.info,
    second: colors.success,
    third: colors.warning,
  };

  const currentStageIndex = FULL_STAGE_ORDER.indexOf(state.stage);
  const isPastStageTask = useCallback((taskStage: string) => {
    const taskIndex = FULL_STAGE_ORDER.indexOf(taskStage);
    return taskIndex >= 0 && taskIndex < currentStageIndex;
  }, [currentStageIndex]);

  const prenatalTasks = useMemo(() => {
    const tasks = state.tasks.filter(
      t => t.type === 'prenatal' && STAGE_ORDER.includes(t.stage as any)
    );
    const stageRank: Record<string, number> = { first: 0, second: 1, third: 2 };
    return tasks.sort((a, b) => {
      const sr = (stageRank[a.stage] ?? 0) - (stageRank[b.stage] ?? 0);
      if (sr !== 0) return sr;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.title.localeCompare(b.title, 'zh-CN');
    });
  }, [state.tasks]);

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const stage of STAGE_ORDER) {
      groups[stage] = prenatalTasks.filter(t => t.stage === stage);
    }
    return groups;
  }, [prenatalTasks]);

  const completedCount = prenatalTasks.filter(t => t.isCompleted).length;
  const totalCount = prenatalTasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const handleToggle = useCallback((id: string, taskStage: string) => {
    if (isPastStageTask(taskStage)) return;
    toggleTask(id);
  }, [toggleTask, isPastStageTask]);

  const editingTask = editingTaskId ? prenatalTasks.find(t => t.id === editingTaskId) : null;

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { minHeight: 120, position: 'relative' },
    progressRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    progressBar: {
      flex: 1, height: 6, borderRadius: 3,
      backgroundColor: colors.surfaceSecondary, overflow: 'hidden',
    },
    progressFill: {
      height: '100%', borderRadius: 3,
      backgroundColor: colors.accent,
    },
    progressText: {
      ...typography.footnote, color: colors.fgSecondary, fontWeight: '600',
    },
    stageLabel: {
      ...typography.caption1, fontWeight: '600', color: colors.fgSecondary,
      marginBottom: spacing.sm, marginTop: spacing.md,
      letterSpacing: 0.5,
    },
    item: {
      flexDirection: 'row', gap: spacing.md,
      paddingBottom: spacing.lg,
      position: 'relative',
    },
    lineCol: {
      alignItems: 'center', width: 24,
    },
    dot: {
      width: 14, height: 14, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1,
    },
    dotCompleted: { backgroundColor: colors.success },
    dotPending: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 2, borderColor: colors.divider,
    },
    line: {
      width: 2, flex: 1,
      position: 'absolute', top: 16,
    },
    content: {
      flex: 1,
    },
    title: {
      ...typography.callout, fontWeight: '600', color: colors.fg,
      marginBottom: 2,
    },
    desc: {
      ...typography.footnote, color: colors.fgSecondary, lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
      marginTop: spacing.sm,
    },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    actionBtnDone: {
      backgroundColor: colors.success + '18',
      borderColor: colors.success + '40',
    },
    actionBtnPending: {
      borderColor: colors.divider,
    },
    actionBtnReport: {
      backgroundColor: colors.accent + '14',
      borderColor: colors.accent + '40',
    },
    actionBtnText: {
      fontSize: 12, fontWeight: '600',
    },
    actionBtnTextDone: { color: colors.success },
    actionBtnTextPending: { color: colors.fgSecondary },
    actionBtnTextReport: { color: colors.accent },
    actionBtnDisabled: {
      borderColor: colors.divider,
      backgroundColor: colors.surfaceSecondary + '60',
    },
    actionBtnTextDisabled: { color: colors.muted },
    // 指标行
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    metricItem: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      minWidth: 56,
    },
    metricLabel: {
      ...typography.caption2,
      color: colors.muted,
      fontSize: 9,
    },
    metricValue: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.fg,
    },
    metricValueWarning: {
      color: colors.error,
    },
    metricDelete: {
      marginLeft: 2,
    },
    itemPast: { opacity: 0.5 },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl + 4,
    },
    // ─── 表单 ───
    formOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      zIndex: 999,
    },
    formContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 420,
      maxHeight: 560,
    },
    formTitle: {
      ...typography.title3,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    formTaskName: {
      ...typography.footnote,
      color: colors.muted,
      marginBottom: spacing.lg,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    fieldGroup: {
      flex: 1,
    },
    fieldLabel: {
      ...typography.caption2,
      color: colors.muted,
      fontWeight: '500',
      marginBottom: 4,
    },
    fieldInput: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fieldInputReadonly: { opacity: 0.5 },
    pickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    pickerOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    pickerOptionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    pickerOptionText: {
      ...typography.caption1,
      color: colors.fgSecondary,
    },
    pickerOptionTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    notesInput: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      padding: spacing.md,
      minHeight: 60,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
    },
    formCancel: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
    },
    formCancelText: {
      ...typography.callout,
      color: colors.muted,
    },
    formSave: {
      backgroundColor: colors.accent,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
    },
    formSaveText: {
      ...typography.callout,
      fontWeight: '600',
      color: '#fff',
    },
  }), [colors]);

  if (totalCount === 0) {
    return (
      <View style={[styles.wrapper, styles.emptyState]}>
        <Ionicons name="calendar-outline" size={20} color={colors.muted} style={{ marginBottom: 4 }} />
        <Text style={{ ...typography.footnote, color: colors.fgSecondary, fontWeight: '500' }}>
          暂无产检任务，请先到任务页添加
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* 进度条 */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>已完成 {completedCount}/{totalCount}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      {/* 时间轴 */}
      <ScrollView style={{ maxHeight: expanded ? undefined : 360 }} showsVerticalScrollIndicator={false}>
        {STAGE_ORDER.map(stage => {
          const items = grouped[stage];
          if (items.length === 0) return null;
          const color = STAGE_COLORS[stage] || colors.accent;

          return (
            <React.Fragment key={stage}>
              <Text style={[styles.stageLabel, { color }]}>{STAGE_LABELS[stage]}</Text>
              {items.map((task, idx) => {
                const showLine = idx < items.length - 1;
                const checkup = getCheckupForTask(task.id);
                const hasCheckup = !!checkup;
                const bpCategory = checkup ? getBPCategory(checkup.systolicBP, checkup.diastolicBP) : '';
                const isBPWarning = bpCategory.includes('需关注');

                return (
                  <View key={task.id} style={[styles.item, isPastStageTask(task.stage) && styles.itemPast]}>
                    {/* 时间轴圆点+连线 */}
                    <View style={styles.lineCol}>
                      <View style={[styles.dot, task.isCompleted ? styles.dotCompleted : styles.dotPending]}>
                        {task.isCompleted && <Ionicons name="checkmark" size={10} color="#fff" />}
                      </View>
                      {showLine && (
                        <View style={[styles.line, {
                          backgroundColor: task.isCompleted ? colors.success + '50' : colors.divider,
                          bottom: 0,
                        }]} />
                      )}
                    </View>

                    {/* 内容区 */}
                    <View style={styles.content}>
                      <Text style={[styles.title, isPastStageTask(task.stage) && { color: colors.muted }]}>{task.title}</Text>
                      {task.description ? (
                        <Text style={styles.desc}>{task.description}</Text>
                      ) : null}

                      {/* 产检指标行（有报告时展示） */}
                      {hasCheckup && checkup && (
                        <View style={styles.metricsRow}>
                          {checkup.systolicBP && checkup.diastolicBP && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>血压</Text>
                              <Text style={[styles.metricValue, isBPWarning && styles.metricValueWarning]}>
                                {checkup.systolicBP}/{checkup.diastolicBP}
                              </Text>
                            </View>
                          )}
                          {checkup.weight && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>体重</Text>
                              <Text style={styles.metricValue}>{checkup.weight}kg</Text>
                            </View>
                          )}
                          {checkup.fetalHeartRate && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>胎心</Text>
                              <Text style={styles.metricValue}>{checkup.fetalHeartRate}</Text>
                            </View>
                          )}
                          {checkup.urineProtein && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>尿蛋白</Text>
                              <Text style={styles.metricValue}>{checkup.urineProtein}</Text>
                            </View>
                          )}
                          {checkup.fundalHeight && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>宫高</Text>
                              <Text style={styles.metricValue}>{checkup.fundalHeight}cm</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* 操作按钮行 */}
                      <View style={styles.actionRow}>
                        {/* 标记完成按钮 */}
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            task.isCompleted ? styles.actionBtnDone : styles.actionBtnPending,
                            isPastStageTask(task.stage) && styles.actionBtnDisabled,
                          ]}
                          onPress={() => handleToggle(task.id, task.stage)}
                          activeOpacity={isPastStageTask(task.stage) ? 1 : 0.7}
                          disabled={isPastStageTask(task.stage)}
                        >
                          <Ionicons
                            name={task.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                            size={12}
                            color={isPastStageTask(task.stage) ? colors.muted : (task.isCompleted ? colors.success : colors.fgSecondary)}
                          />
                          <Text style={[
                            styles.actionBtnText,
                            isPastStageTask(task.stage) ? styles.actionBtnTextDisabled : (task.isCompleted ? styles.actionBtnTextDone : styles.actionBtnTextPending),
                          ]}>
                            {isPastStageTask(task.stage) ? '已过期' : (task.isCompleted ? '已完成' : '标记完成')}
                          </Text>
                        </TouchableOpacity>

                        {/* 记录/编辑指标按钮 */}
                        {!isPastStageTask(task.stage) && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnReport]}
                            onPress={() => handleStartEdit(task.id, checkup)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={hasCheckup ? 'create-outline' : 'add-circle-outline'}
                              size={12}
                              color={colors.accent}
                            />
                            <Text style={[styles.actionBtnText, styles.actionBtnTextReport]}>
                              {hasCheckup ? '编辑指标' : '记录指标'}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* 删除报告（已有报告时） */}
                        {hasCheckup && !isPastStageTask(task.stage) && (
                          <TouchableOpacity
                            onPress={() => handleDeleteCheckup(task.id)}
                            activeOpacity={0.6}
                            style={[styles.actionBtn, { borderColor: 'transparent' }]}
                          >
                            <Ionicons name="trash-outline" size={12} color={colors.error} />
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.error }}>清除</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* 编辑弹窗 */}
      {editingTaskId && (
        <View style={styles.formOverlay}>
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>记录产检指标</Text>
            <Text style={styles.formTaskName}>{editingTask?.title}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {/* 血压 */}
              <Text style={styles.fieldLabel}>血压（mmHg）</Text>
              <View style={styles.fieldRow}>
                <View style={styles.fieldGroup}>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="收缩压"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={formData.systolicBP?.toString() || ''}
                    onChangeText={t => setFormData(f => ({ ...f, systolicBP: t ? parseInt(t) || undefined : undefined }))}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="舒张压"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={formData.diastolicBP?.toString() || ''}
                    onChangeText={t => setFormData(f => ({ ...f, diastolicBP: t ? parseInt(t) || undefined : undefined }))}
                  />
                </View>
              </View>

              {/* 体重 + 宫高 */}
              <View style={styles.fieldRow}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>体重（kg）</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="例如: 65.5"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={formData.weight?.toString() || ''}
                    onChangeText={t => setFormData(f => ({ ...f, weight: t ? parseFloat(t) || undefined : undefined }))}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>宫高（cm）</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="例如: 30"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={formData.fundalHeight?.toString() || ''}
                    onChangeText={t => setFormData(f => ({ ...f, fundalHeight: t ? parseInt(t) || undefined : undefined }))}
                  />
                </View>
              </View>

              {/* 胎心 */}
              <View style={styles.fieldRow}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>胎心（bpm）</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="例如: 140"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={formData.fetalHeartRate?.toString() || ''}
                    onChangeText={t => setFormData(f => ({ ...f, fetalHeartRate: t ? parseInt(t) || undefined : undefined }))}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>孕周</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.fieldInputReadonly]}
                    placeholder="孕周"
                    placeholderTextColor={colors.muted}
                    value={formData.week?.toString() || ''}
                    editable={false}
                  />
                </View>
              </View>

              {/* 尿蛋白 */}
              <Text style={styles.fieldLabel}>尿蛋白</Text>
              <View style={[styles.pickerRow, { marginBottom: spacing.md }]}>
                {URINE_PROTEIN_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerOption, formData.urineProtein === opt && styles.pickerOptionActive]}
                    onPress={() => setFormData(f => ({ ...f, urineProtein: f.urineProtein === opt ? undefined : opt }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, formData.urineProtein === opt && styles.pickerOptionTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 备注 */}
              <Text style={styles.fieldLabel}>备注</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="医生建议或其他备注"
                placeholderTextColor={colors.muted}
                value={formData.notes || ''}
                onChangeText={t => setFormData(f => ({ ...f, notes: t }))}
                multiline
              />
            </ScrollView>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.formCancel} onPress={() => setEditingTaskId(null)}>
                <Text style={styles.formCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formSave} onPress={handleSaveCheckup} activeOpacity={0.7}>
                <Text style={styles.formSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default PrenatalTimeline;
