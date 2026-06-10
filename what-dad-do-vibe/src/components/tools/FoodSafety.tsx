import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { getFoodSafety } from '../../lib/api';
import { FoodSafety } from '../../lib/supabase';
import { useColors, useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { LoadingDot } from './ToolBase';

const LEVEL_LABELS: Record<string, string> = {
  safe: '可以吃',
  caution: '适量吃',
  forbidden: '绝对不能吃',
};

const LEVEL_COLORS: Record<string, string> = {
  safe: '#34c759',
  caution: '#ff9f0a',
  forbidden: '#ff3b30',
};

const DARK_LEVEL_COLORS: Record<string, string> = {
  safe: '#5AB87A',
  caution: '#D4A84E',
  forbidden: '#D46A6A',
};

const PERIODS = [
  { key: 'preconception' as const, label: '备孕' },
  { key: 'first' as const, label: '孕早期' },
  { key: 'second' as const, label: '孕中期' },
  { key: 'third' as const, label: '孕晚期' },
  { key: 'postpartum' as const, label: '产后' },
  { key: 'baby_0_3m' as const, label: '婴儿0-3月' },
  { key: 'baby_3_12m' as const, label: '婴儿3-12月' },
  { key: 'baby_1_3y' as const, label: '婴儿1-3岁' },
];

// 提取到组件外部，避免每次渲染重建组件类型
function SafetyBadge({ level, isDark }: { level: string; isDark?: boolean }) {
  const colors = isDark ? DARK_LEVEL_COLORS : LEVEL_COLORS;
  return (
    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6, backgroundColor: colors[level] + '20' }}>
      <Text style={{ ...typography.caption1, fontWeight: '600', fontSize: 11, color: colors[level] }}>{LEVEL_LABELS[level]}</Text>
    </View>
  );
}

export function FoodSafetyTool({ expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const [foods, setFoods] = useState<FoodSafety[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const list = await getFoodSafety();
        setFoods(list);
      } catch (e) {
        console.error('Failed to load food safety data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasSearch = search.trim().length > 0;

  const filtered = useMemo(() => {
    if (!hasSearch) return [];
    const kw = search.trim().toLowerCase();
    const exact: FoodSafety[] = [];
    const fuzzy: FoodSafety[] = [];
    for (const f of foods) {
      if (f.name.toLowerCase().includes(kw)) {
        if (f.name === kw || f.name.startsWith(kw)) exact.push(f);
        else fuzzy.push(f);
      }
    }
    return [...exact, ...fuzzy].slice(0, 30);
  }, [foods, search, hasSearch]);

  const styles = useMemo(() => StyleSheet.create({
    container: { maxHeight: expanded ? undefined : 540 },
    containerCollapsed: { maxHeight: expanded ? undefined : 56 },
    containerExpanded: { maxHeight: expanded ? undefined : 540 },
    searchInput: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    empty: { ...typography.callout, color: colors.fgSecondary, textAlign: 'center', paddingVertical: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    foodName: { ...typography.callout, fontWeight: '700', color: colors.fg },
    category: { ...typography.caption1, color: colors.fgSecondary },
    note: { ...typography.footnote, color: colors.fgSecondary, marginBottom: spacing.sm, lineHeight: 18 },
    table: { gap: 3 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
    periodLabel: { ...typography.footnote, color: colors.fgSecondary, flex: 1 },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
    loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    loadingText: { ...typography.footnote, color: colors.fgSecondary },
  }), [colors, expanded]);

  return (
    <ScrollView
      style={[styles.container, hasSearch ? styles.containerExpanded : styles.containerCollapsed]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <TextInput
        style={styles.searchInput}
        placeholder="输入食物名称搜索…"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
        autoFocus
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={150} />
            <LoadingDot delay={300} />
          </View>
          <Text style={styles.loadingText}>正在加载食物数据…</Text>
        </View>
      ) : (
        <>
          {hasSearch && filtered.length === 0 && (
            <Text style={styles.empty}>未找到该食物数据</Text>
          )}

      {filtered.map(food => (
        <View key={food.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.category}>{food.category}</Text>
          </View>
          {food.note && <Text style={styles.note}>{food.note}</Text>}

          <View style={styles.table}>
            {PERIODS.map(p => (
              <View key={p.key} style={styles.row}>
                <Text style={styles.periodLabel}>{p.label}</Text>
                <SafetyBadge level={food[p.key]} isDark={isDark} />
              </View>
            ))}
          </View>
        </View>
      ))}
        </>
      )}
    </ScrollView>
  );
}

export default FoodSafetyTool;
