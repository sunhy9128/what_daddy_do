import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { BABY_MEDICATION_DATA, BabyMedication } from '../../lib/baby-medication-safety-data';

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

type AgePeriodKey = 'baby_0_3m' | 'baby_3_12m' | 'baby_1_3y' | 'baby_3_6y';

const AGE_PERIODS: { key: AgePeriodKey; label: string }[] = [
  { key: 'baby_0_3m' as const, label: '0-3个月' },
  { key: 'baby_3_12m' as const, label: '3-12个月' },
  { key: 'baby_1_3y' as const, label: '1-3岁' },
  { key: 'baby_3_6y' as const, label: '3-6岁' },
];

const ALL_CATEGORIES = [...new Set(BABY_MEDICATION_DATA.map(m => m.category))];

function getCurrentAgePeriod(months: number | null): AgePeriodKey | '' {
  if (months === null) return '';
  if (months <= 3) return 'baby_0_3m';
  if (months <= 12) return 'baby_3_12m';
  if (months <= 36) return 'baby_1_3y';
  return 'baby_3_6y';
}

function getCurrentAgeLabel(months: number | null): string {
  if (months === null) return '';
  if (months <= 3) return '0-3个月';
  if (months <= 12) return '3-12个月';
  if (months <= 36) return '1-3岁';
  return '3-6岁';
}

function SafetyBadge({ level, isDark }: { level: string; isDark?: boolean }) {
  const clr = isDark ? DARK_LEVEL_COLORS : LEVEL_COLORS;
  return (
    <View style={{ paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: 6, backgroundColor: clr[level] + '20' }}>
      <Text style={{ ...typography.caption1, fontWeight: '700', fontSize: 11, color: clr[level] }}>{LEVEL_LABELS[level]}</Text>
    </View>
  );
}

export function BabyMedicationSafetyTool({ expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const { state } = useApp();

  // 计算宝宝当前月龄
  const babyAgeMonths = useMemo(() => {
    if (state.stage !== 'postpartum' || !state.babies?.[0]?.birthDate) return null;
    const birthDate = new Date(state.babies[0].birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birthDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  }, [state.stage, state.babies]);

  const currentPeriodKey = getCurrentAgePeriod(babyAgeMonths);
  const currentPeriodLabel = getCurrentAgeLabel(babyAgeMonths);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasSearch = search.trim().length > 0;

  const filtered = useMemo(() => {
    let list = BABY_MEDICATION_DATA;

    if (ageFilter && currentPeriodKey) {
      list = list.filter(m => m.ageRanges[currentPeriodKey] !== 'forbidden');
    }

    if (activeCategory) {
      list = list.filter(m => m.category === activeCategory);
    }
    if (hasSearch) {
      const kw = search.trim().toLowerCase();
      const exact: BabyMedication[] = [];
      const fuzzy: BabyMedication[] = [];
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
    return activeCategory || ageFilter ? list : [];
  }, [search, activeCategory, ageFilter, currentPeriodKey]);

  // 当前月龄下有多少禁用药品
  const ageFilterHiddenCount = useMemo(() => {
    if (!ageFilter || !currentPeriodKey) return 0;
    return BABY_MEDICATION_DATA.filter(m => m.ageRanges[currentPeriodKey] === 'forbidden').length;
  }, [ageFilter, currentPeriodKey]);

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
    ageFilterBtn: {
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
    ageFilterBtnActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    ageFilterText: {
      ...typography.caption1,
      fontWeight: '500',
      color: colors.fgSecondary,
    },
    ageFilterTextActive: {
      color: colors.accent,
      fontWeight: '600',
    },
    ageFilterBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: colors.accent + '15',
    },
    ageFilterBadgeText: {
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
    formTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: colors.bg,
      marginTop: spacing.xs,
    },
    formTagText: { ...typography.caption2, color: colors.muted },
    expandIcon: { padding: spacing.xs },
    note: { ...typography.footnote, color: colors.fgSecondary, marginBottom: spacing.sm, lineHeight: 20, marginTop: spacing.sm },
    dosageBox: {
      backgroundColor: colors.accentLight,
      borderRadius: radius.sm,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 2,
      borderLeftColor: colors.accent,
    },
    dosageLabel: { ...typography.caption1, fontWeight: '600', color: colors.accent, marginBottom: spacing.xs },
    dosageText: { ...typography.footnote, color: colors.fgSecondary, lineHeight: 18 },
    table: { gap: 4, marginTop: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    periodLabel: { ...typography.footnote, color: colors.fgSecondary, flex: 1 },
    rowCurrent: { backgroundColor: colors.accentLight, borderRadius: 4, marginHorizontal: -spacing.xs, paddingHorizontal: spacing.xs },
    periodLabelCurrent: { color: colors.accent, fontWeight: '600' },
    safetyHint: { ...typography.caption2, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
    noAgeHint: {
      ...typography.footnote,
      color: colors.muted,
    },
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
      style={[styles.container, (hasSearch || activeCategory || ageFilter) ? styles.containerExpanded : styles.containerCollapsed]}
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

      {/* 按年龄筛选 */}
      <View style={styles.filterRow}>
        {babyAgeMonths !== null ? (
          <TouchableOpacity
            style={[styles.ageFilterBtn, ageFilter && styles.ageFilterBtnActive]}
            onPress={() => setAgeFilter(!ageFilter)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={ageFilter ? 'funnel' : 'funnel-outline'}
              size={15}
              color={ageFilter ? colors.accent : colors.muted}
            />
            <Text style={[styles.ageFilterText, ageFilter && styles.ageFilterTextActive]}>
              仅看{currentPeriodLabel}可用药
            </Text>
            {ageFilter && (
              <View style={styles.ageFilterBadge}>
                <Text style={styles.ageFilterBadgeText}>隐藏{ageFilterHiddenCount}种</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
            <Text style={styles.noAgeHint}>填写宝宝出生日期后可按月龄筛选</Text>
          </View>
        )}

        {(hasSearch || activeCategory || ageFilter) && (
          <Text style={{ ...typography.caption1, color: colors.muted }}>
            共 {filtered.length} 种
          </Text>
        )}
      </View>

      {/* 提示 */}
      {!(hasSearch || activeCategory || ageFilter) && (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
          <Ionicons name="search-outline" size={24} color={colors.muted} style={{ opacity: 0.5 }} />
          <Text style={{ ...typography.footnote, color: colors.muted, textAlign: 'center' }}>
            搜索药品名或选择分类查看
          </Text>
          <Text style={{ ...typography.caption2, color: colors.muted, textAlign: 'center' }}>
            也可按月龄筛选，只看适合宝宝当前年龄的药
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
                {drug.form && (
                  <View style={styles.formTag}>
                    <Text style={styles.formTagText}>剂型：{drug.form}</Text>
                  </View>
                )}
              </View>
              <View style={styles.expandIcon}>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <>
                {drug.note && <Text style={styles.note}>{drug.note}</Text>}

                {drug.dosageNote && (
                  <View style={styles.dosageBox}>
                    <Text style={styles.dosageLabel}>剂量参考</Text>
                    <Text style={styles.dosageText}>{drug.dosageNote}</Text>
                  </View>
                )}

                <View style={styles.table}>
                  {AGE_PERIODS.map(p => {
                    const isCurrent = ageFilter && currentPeriodKey === p.key;
                    return (
                      <View key={p.key} style={[styles.row, isCurrent && styles.rowCurrent]}>
                        <Text style={[styles.periodLabel, isCurrent && styles.periodLabelCurrent]}>{p.label}</Text>
                        <SafetyBadge level={drug.ageRanges[p.key]} isDark={isDark} />
                      </View>
                    );
                  })}
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

export default BabyMedicationSafetyTool;
