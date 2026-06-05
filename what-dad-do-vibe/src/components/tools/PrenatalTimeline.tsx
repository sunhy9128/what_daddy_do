import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { useApp, Task } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';

const STAGE_ORDER = ['first', 'second', 'third'] as const;
const STAGE_LABELS: Record<string, string> = { first: '孕早期', second: '孕中期', third: '孕晚期' };
const STAGE_COLORS: Record<string, string> = {
  first: '#4A6B8A',
  second: '#4A7C5E',
  third: '#B8963E',
};

export function PrenatalTimeline({ userId: _userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const { state, toggleTask } = useApp();

  // 从待办清单中过滤出产检任务（type='prenatal'，仅孕期阶段）
  const prenatalTasks = useMemo(() => {
    const tasks = state.tasks.filter(
      t => t.type === 'prenatal' && STAGE_ORDER.includes(t.stage as any)
    );
    // 按阶段排序，同阶段内按 dueDate（如有）再按标题
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

  // 按阶段分组
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

  const handleToggle = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { minHeight: 120 },
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
    dotCompleted: {
      backgroundColor: colors.success,
    },
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
    checkBtn: {
      marginTop: spacing.sm, alignSelf: 'flex-start',
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    checkBtnDone: {
      backgroundColor: colors.success + '18',
      borderColor: colors.success + '40',
    },
    checkBtnPending: {
      borderColor: colors.divider,
    },
    checkBtnText: {
      fontSize: 12, fontWeight: '600',
    },
    checkBtnTextDone: { color: colors.success },
    checkBtnTextPending: { color: colors.fgSecondary },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl + 4,
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
      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
        {STAGE_ORDER.map(stage => {
          const items = grouped[stage];
          if (items.length === 0) return null;
          const color = STAGE_COLORS[stage] || colors.accent;

          return (
            <React.Fragment key={stage}>
              <Text style={[styles.stageLabel, { color }]}>{STAGE_LABELS[stage]}</Text>
              {items.map((task, idx) => {
                const showLine = idx < items.length - 1;
                return (
                  <View key={task.id} style={styles.item}>
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
                    <View style={styles.content}>
                      <Text style={styles.title}>{task.title}</Text>
                      {task.description ? (
                        <Text style={styles.desc}>{task.description}</Text>
                      ) : null}
                      <TouchableOpacity
                        style={[styles.checkBtn, task.isCompleted ? styles.checkBtnDone : styles.checkBtnPending]}
                        onPress={() => handleToggle(task.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.checkBtnText, task.isCompleted ? styles.checkBtnTextDone : styles.checkBtnTextPending]}>
                          {task.isCompleted ? '✓ 已完成' : '标记完成'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default PrenatalTimeline;
