import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { MEDICATION_DATA, MedicationSafety } from '../../lib/medication-safety-data';
import { LoadingDot } from './ToolBase';

// ─── 安全等级 ───
const LEVEL_LABELS: Record<string, string> = {
  safe: '安全',
  caution: '慎用',
  forbidden: '禁用',
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

// 孕期阶段 → 中文标签
const STAGE_LABELS: Record<string, string> = {
  preconception: '备孕期',
  first: '孕早期',
  second: '孕中期',
  third: '孕晚期',
  postpartum: '产后',
};

// 提取分类列表
const ALL_CATEGORIES = [...new Set(MEDICATION_DATA.map(m => m.category))];

function SafetyBadge({ level, isDark }: { level: string; isDark?: boolean }) {
  const clr = isDark ? DARK_LEVEL_COLORS : LEVEL_COLORS;
  return (
    <View style={{ paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: 6, backgroundColor: clr[level] + '20' }}>
      <Text style={{ ...typography.caption1, fontWeight: '700', fontSize: 11, color: clr[level] }}>{LEVEL_LABELS[level]}</Text>
    </View>
  );
}

export function MedicationSafetyTool({ expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const { state } = useApp();
  const currentStage = state.stage;
  const stageLabel = STAGE_LABELS[currentStage] || '';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasSearch = search.trim().length > 0;
  const stagePeriodKey = currentStage as keyof MedicationSafety['safety'];

  const filtered = useMemo(() => {
    let list = MEDICATION_DATA;

    // 按当前孕期筛选（只显示安全+慎用，隐藏禁用）
    if (stageFilter && stagePeriodKey) {
      list = list.filter(m => m.safety[stagePeriodKey] !== 'forbidden');
    }

    if (activeCategory) {
      list = list.filter(m => m.category === activeCategory);
    }
    if (hasSearch) {
      const kw = search.trim().toLowerCase();
      const exact: MedicationSafety[] = [];
      const fuzzy: MedicationSafety[] = [];
      for (const m of list) {
        const match = m.name.toLowerCase().includes(kw)
          || m.brandNames?.some(b => b.toLowerCase().includes(kw))
          || m.category.toLowerCase().includes(kw);
        if (match) {
          if (m.name === kw || m.name.startsWith(kw) || m.brandNames?.some(b => b === kw || b.startsWith(kw))) {
            exact.push(m);
          } else {
            fuzzy.push(m);
          }
        }
      }
      return [...exact, ...fuzzy].slice(0, 40);
    }
    return activeCategory || stageFilter ? list : [];
  }, [search, activeCategory, stageFilter, stagePeriodKey]);

  // 按孕期筛选后有多少条被排除
  const stageFilterCount = useMemo(() => {
    if (!stageFilter || !stagePeriodKey) return 0;
    return MEDICATION_DATA.filter(m => m.safety[stagePeriodKey] === 'forbidden').length;
  }, [stageFilter, stagePeriodKey]);

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
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    categoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 1,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    categoryChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    categoryChipText: {
      ...typography.caption1,
      fontWeight: '500',
      color: colors.fgSecondary,
    },
    categoryChipTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    stageFilterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    stageFilterBtnActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    stageFilterText: {
      ...typography.caption1,
      fontWeight: '500',
      color: colors.fgSecondary,
    },
    stageFilterTextActive: {
      color: colors.accent,
      fontWeight: '600',
    },
    stageFilterBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: colors.accent + '15',
    },
    stageFilterBadgeText: {
      ...typography.caption2,
      fontWeight: '600',
      color: colors.accent,
    },
    empty: { ...typography.callout, color: colors.fgSecondary, textAlign: 'center', paddingVertical: spacing.xl },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    nameRow: { flex: 1, marginRight: spacing.sm },
    drugName: { ...typography.callout, fontWeight: '700', color: colors.fg, marginBottom: 2 },
    brandNames: { ...typography.caption1, color: colors.muted, marginBottom: spacing.xs },
    category: { ...typography.caption1, color: colors.accent, fontWeight: '500' },
    expandIcon: { padding: spacing.xs },
    note: { ...typography.footnote, color: colors.fgSecondary, marginBottom: spacing.sm, lineHeight: 20, marginTop: spacing.sm },
    fdaBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.accentLight,
      marginBottom: spacing.sm,
    },
    fdaBadgeText: { ...typography.caption1, fontWeight: '600', color: colors.accent, fontSize: 11 },
    table: { gap: 4, marginTop: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    periodLabel: { ...typography.footnote, color: colors.fgSecondary, flex: 1 },
    safetyHint: { ...typography.caption2, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
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
      style={[styles.container, (hasSearch || activeCategory || stageFilter) ? styles.containerExpanded : styles.containerCollapsed]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <TextInput
        style={styles.searchInput}
        placeholder="输入药品名或商品名搜索…"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={t => { setSearch(t); if (t) setActiveCategory(null); }}
        autoFocus
      />

      {/* 分类筛选 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={styles.categoryRow}>
          {ALL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => {
                setActiveCategory(activeCategory === cat ? null : cat);
                if (activeCategory !== cat) setSearch('');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 按孕期筛选 + 结果计数 */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.stageFilterBtn, stageFilter && styles.stageFilterBtnActive]}
          onPress={() => setStageFilter(!stageFilter)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={stageFilter ? 'funnel' : 'funnel-outline'}
            size={15}
            color={stageFilter ? colors.accent : colors.muted}
          />
          <Text style={[styles.stageFilterText, stageFilter && styles.stageFilterTextActive]}>
            仅看{stageLabel}可用药
          </Text>
          {stageFilter && (
            <View style={styles.stageFilterBadge}>
              <Text style={styles.stageFilterBadgeText}>隐藏{stageFilterCount}种</Text>
            </View>
          )}
        </TouchableOpacity>

        {(hasSearch || activeCategory || stageFilter) && (
          <Text style={{ ...typography.caption1, color: colors.muted }}>
            共 {filtered.length} 种
          </Text>
        )}
      </View>

      {/* 提示 */}
      {!(hasSearch || activeCategory || stageFilter) && (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
          <Ionicons name="search-outline" size={24} color={colors.muted} style={{ opacity: 0.5 }} />
          <Text style={{ ...typography.footnote, color: colors.muted, textAlign: 'center' }}>
            搜索药品名或选择分类查看
          </Text>
          <Text style={{ ...typography.caption2, color: colors.muted, textAlign: 'center' }}>
            也可开启孕期筛选，只看适合当前阶段的药
          </Text>
        </View>
      )}

      {(hasSearch || activeCategory) && filtered.length === 0 && (
        <Text style={styles.empty}>未找到该药品数据</Text>
      )}

      {filtered.map(drug => {
        const isExpanded = expandedId === drug.id;
        return (
          <View key={drug.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpandedId(isExpanded ? null : drug.id)}
              activeOpacity={0.7}
            >
              <View style={styles.nameRow}>
                <Text style={styles.drugName}>{drug.name}</Text>
                {drug.brandNames && drug.brandNames.length > 0 && (
                  <Text style={styles.brandNames}>常见商品名：{drug.brandNames.join('、')}</Text>
                )}
                <Text style={styles.category}>{drug.category}</Text>
              </View>
              <View style={styles.expandIcon}>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <>
                {drug.note && <Text style={styles.note}>{drug.note}</Text>}

                {drug.fdaCategory && (
                  <View style={styles.fdaBadge}>
                    <Text style={styles.fdaBadgeText}>FDA分级：{drug.fdaCategory}</Text>
                  </View>
                )}

                <View style={styles.table}>
                  {PERIODS.map(p => (
                    <View key={p.key} style={styles.row}>
                      <Text style={styles.periodLabel}>{p.label}</Text>
                      <SafetyBadge level={drug.safety[p.key]} isDark={isDark} />
                    </View>
                  ))}
                </View>

                <Text style={styles.safetyHint}>以上信息仅供参考，具体用药请咨询医生</Text>
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

export default MedicationSafetyTool;
