import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { BUMP_SIZE_DATA, getBumpSizeForWeek } from '../../lib/bump-size-data';

export function BabyBumpSize({ userId: _userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const { state } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const currentWeek = state.weeksPregnant;

  const current = useMemo(() => getBumpSizeForWeek(currentWeek), [currentWeek]);

  // Auto-scroll to current week on mount
  useEffect(() => {
    if (current) {
      const idx = BUMP_SIZE_DATA.findIndex(e => e.week === current.week);
      if (idx >= 0) {
        const scrollTo = Math.max(0, idx * 44 - 80);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: scrollTo, animated: true });
        }, 300);
      }
    }
  }, [currentWeek]);

  const styles = useMemo(() => StyleSheet.create({
    container: { paddingVertical: spacing.xs },
    currentCard: {
      backgroundColor: colors.accentLight,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    currentEmoji: {
      fontSize: 56,
      marginBottom: spacing.sm,
    },
    currentTitle: {
      ...typography.title2,
      fontWeight: '700',
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    currentWeek: {
      ...typography.subhead,
      color: colors.fgSecondary,
      marginBottom: spacing.sm,
    },
    currentMeta: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    currentMetaItem: {
      alignItems: 'center',
    },
    currentMetaLabel: {
      ...typography.caption2,
      color: colors.fgSecondary,
    },
    currentMetaValue: {
      ...typography.callout,
      fontWeight: '600',
      color: colors.fg,
    },
    currentDesc: {
      ...typography.footnote,
      color: colors.fgSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    timeline: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...shadows.sm,
    },
    timelineTitle: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.fgSecondary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    rowCurrent: {
      backgroundColor: colors.accentLight,
    },
    rowEmoji: {
      fontSize: 22,
      width: 32,
      textAlign: 'center',
    },
    rowWeek: {
      ...typography.footnote,
      color: colors.fgSecondary,
      width: 44,
      fontWeight: '500',
    },
    rowFruit: {
      ...typography.footnote,
      color: colors.fg,
      fontWeight: '600',
      flex: 1,
    },
    rowSize: {
      ...typography.caption2,
      color: colors.fgSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl + 4,
      borderRadius: radius.md,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {/* 当前周数卡片 */}
      {current && state.stage !== 'postpartum' && state.stage !== 'preconception' ? (
        <View style={styles.currentCard}>
          <Text style={styles.currentEmoji}>{current.emoji}</Text>
          <Text style={styles.currentTitle}>像 {current.fruit} 一样大</Text>
          <Text style={styles.currentWeek}>第 {currentWeek} 周</Text>
          <View style={styles.currentMeta}>
            <View style={styles.currentMetaItem}>
              <Text style={styles.currentMetaLabel}>身长</Text>
              <Text style={styles.currentMetaValue}>{current.lengthCm} cm</Text>
            </View>
            <View style={styles.currentMetaItem}>
              <Text style={styles.currentMetaLabel}>体重</Text>
              <Text style={styles.currentMetaValue}>{current.weightG} g</Text>
            </View>
          </View>
          <Text style={styles.currentDesc}>{current.description}</Text>
        </View>
      ) : state.stage === 'preconception' ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🥚</Text>
          <Text style={{ ...typography.footnote, color: colors.fgSecondary, fontWeight: '500', textAlign: 'center' }}>
            备孕中，期待好消息！
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>👶</Text>
          <Text style={{ ...typography.footnote, color: colors.fgSecondary, fontWeight: '500', textAlign: 'center' }}>
            宝宝已出生，回顾一下孕期的成长吧
          </Text>
        </View>
      )}

      {/* 完整时间轴 */}
      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>每周大小对比</Text>
        <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false} ref={scrollRef}>
          {BUMP_SIZE_DATA.map((entry, idx) => {
            const isCurrent = entry.week === current?.week;
            return (
              <View key={entry.week} style={[styles.row, isCurrent && styles.rowCurrent]}>
                <Text style={styles.rowEmoji}>{entry.emoji}</Text>
                <Text style={styles.rowWeek}>第{entry.week}周</Text>
                <Text style={styles.rowFruit}>{entry.fruit}</Text>
                <Text style={styles.rowSize}>{entry.lengthCm}cm</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default BabyBumpSize;
