import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import {
  DAD_PREP_ITEMS, loadDadPrepProgress, saveDadPrepProgress,
  DadPrepItem, DadPrepProgress,
} from '../../lib/storage';
import { LoadingDot } from './ToolBase';

const PHASE_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }> = {
  't-30': { label: '提前30天', icon: 'calendar-outline', desc: '从容准备' },
  't-7': { label: '提前7天', icon: 'time-outline', desc: '最后冲刺' },
  't-1': { label: '临产当天', icon: 'alert-circle-outline', desc: '随时出发' },
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  '行政': 'briefcase-outline',
  '准备': 'settings-outline',
  '物品': 'bag-outline',
  '知识': 'book-outline',
  '沟通': 'chatbubbles-outline',
  '心理': 'heart-outline',
};

export function DadDeliveryPrep({ userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const [progress, setProgress] = useState<Record<string, DadPrepProgress>>({});
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const data = await loadDadPrepProgress(userId);
        const map: Record<string, DadPrepProgress> = {};
        for (const p of data) map[p.itemId] = p;
        setProgress(map);
      } catch (e) {
        console.error('loadDadPrepProgress error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persistProgress = useCallback((newProgress: Record<string, DadPrepProgress>) => {
    setProgress(newProgress);
    saveDadPrepProgress(userId, Object.values(newProgress));
  }, [userId]);

  const isPrepared = useCallback((itemId: string) => progress[itemId]?.isPrepared === true, [progress]);

  const handleToggle = useCallback((itemId: string) => {
    const current = isPrepared(itemId);
    const newEntry: DadPrepProgress = {
      itemId,
      isPrepared: !current,
      preparedAt: !current ? new Date().toISOString() : undefined,
    };
    const newProgress = { ...progress, [itemId]: newEntry };
    persistProgress(newProgress);
  }, [progress, isPrepared, persistProgress]);

  // 按阶段分组
  const phases = useMemo(() => {
    const groups: Record<string, DadPrepItem[]> = { 't-30': [], 't-7': [], 't-1': [] };
    for (const item of DAD_PREP_ITEMS) {
      groups[item.phase].push(item);
    }
    return Object.entries(groups);
  }, []);

  const phaseKeys = useMemo(() => phases.map(([k]) => k), [phases]);

  const displayedPhase = activePhase || 't-30';

  // 当前阶段的物品
  const currentItems = useMemo(() => {
    return DAD_PREP_ITEMS.filter(i => i.phase === displayedPhase);
  }, [displayedPhase]);

  // 统计
  const totalCount = DAD_PREP_ITEMS.length;
  const preparedCount = useMemo(() => {
    let n = 0;
    for (const item of DAD_PREP_ITEMS) {
      if (isPrepared(item.id)) n++;
    }
    return n;
  }, [DAD_PREP_ITEMS, isPrepared]);
  const progressPct = totalCount > 0 ? Math.round((preparedCount / totalCount) * 100) : 0;

  const styles = useMemo(() => StyleSheet.create({
    container: { gap: spacing.md },
    // 加载
    loadingWrap: {
      flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    // 整体进度
    progressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
    },
    progressInfo: { flex: 1 },
    progressLabel: {
      ...typography.footnote, fontWeight: '600', color: colors.fg,
    },
    progressDetail: {
      ...typography.caption2, color: colors.muted, marginTop: 2,
    },
    progressBar: {
      marginTop: spacing.sm, height: 6,
      backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden',
    },
    progressFill: {
      height: '100%', backgroundColor: colors.accent, borderRadius: 3,
    },
    progressPct: {
      ...typography.title2, fontWeight: '700', color: colors.accent,
    },
    // 阶段切换
    phaseRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    phaseChip: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    phaseChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    phaseLabel: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.fgSecondary,
    },
    phaseLabelActive: {
      color: '#fff',
    },
    phaseCount: {
      ...typography.caption2,
      color: colors.muted,
    },
    phaseCountActive: {
      color: '#ffffffcc',
    },
    // 物品列表
    itemsWrap: {
      maxHeight: 360,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    itemCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      backgroundColor: colors.bg,
    },
    itemCheckboxActive: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    itemInfo: { flex: 1 },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    itemName: {
      ...typography.callout,
      fontWeight: '500',
      color: colors.fg,
      flex: 1,
    },
    itemNameDone: {
      color: colors.muted,
      textDecorationLine: 'line-through',
    },
    itemCategory: {
      ...typography.caption2,
      color: colors.muted,
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      overflow: 'hidden',
    },
    itemDesc: {
      ...typography.footnote,
      color: colors.fgSecondary,
      lineHeight: 18,
      marginTop: 4,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl + 4,
      gap: spacing.xs,
    },
    emptyText: {
      ...typography.footnote,
      color: colors.muted,
    },
  }), [colors]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <LoadingDot delay={0} />
        <LoadingDot delay={200} />
        <LoadingDot delay={400} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 整体进度 */}
      <View style={styles.progressCard}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>爸爸分娩准备</Text>
          <Text style={styles.progressDetail}>已完成 {preparedCount}/{totalCount} 项</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>
        <Text style={styles.progressPct}>{progressPct}%</Text>
      </View>

      {/* 阶段切换 */}
      <View style={styles.phaseRow}>
        {phaseKeys.map(key => {
          const cfg = PHASE_CONFIG[key];
          const count = DAD_PREP_ITEMS.filter(i => i.phase === key).length;
          const doneCount = DAD_PREP_ITEMS.filter(i => i.phase === key && isPrepared(i.id)).length;
          const isActive = displayedPhase === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.phaseChip, isActive && styles.phaseChipActive]}
              onPress={() => setActivePhase(key)}
              activeOpacity={0.7}
            >
              <Ionicons name={cfg.icon} size={16} color={isActive ? '#fff' : colors.muted} />
              <Text style={[styles.phaseLabel, isActive && styles.phaseLabelActive]}>{cfg.label}</Text>
              <Text style={[styles.phaseCount, isActive && styles.phaseCountActive]}>{doneCount}/{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 物品列表 */}
      <ScrollView style={styles.itemsWrap} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {currentItems.length > 0 ? (
          currentItems.map(item => {
            const done = isPrepared(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemCheckbox, done && styles.itemCheckboxActive]}>
                  {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemName, done && styles.itemNameDone]} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  </View>
                  {item.description && (
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            <Text style={styles.emptyText}>这一阶段全部完成！</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default DadDeliveryPrep;
