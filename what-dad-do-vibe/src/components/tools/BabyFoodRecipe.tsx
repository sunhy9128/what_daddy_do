import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { BABY_FOOD_RECIPES, BabyFoodRecipe } from '../../lib/baby-food-recipe-data';

// Android 启用 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── 过敏原标签 ───
// 含过敏原的食谱显示对应标签，无过敏原的显示「低敏」
const LOW_ALLERGEN_LABEL = '低敏';

// 过敏原筛选 chip 列表：「低敏」+ 常见过敏原
const ALLERGEN_FILTERS = ['低敏', '蛋', '鱼', '虾', '小麦', '大豆', '乳'];

// 过敏原徽章配色（浅色背景 + 同色字）
const ALLERGEN_COLORS: Record<string, string> = {
  蛋: '#ff9f0a',
  鱼: '#ff9f0a',
  虾: '#ff9f0a',
  小麦: '#ff9f0a',
  坚果: '#ff3b30',
  乳: '#ff9f0a',
  大豆: '#ff9f0a',
};
const ALLERGEN_DARK_COLORS: Record<string, string> = {
  蛋: '#D4A84E',
  鱼: '#D4A84E',
  虾: '#D4A84E',
  小麦: '#D4A84E',
  坚果: '#D46A6A',
  乳: '#D4A84E',
  大豆: '#D4A84E',
};
const LOW_ALLERGEN_COLOR = '#34c759';
const LOW_ALLERGEN_DARK_COLOR = '#5AB87A';

// 月龄徽章：根据 minMonth 着色，越靠后颜色越深
const MONTH_COLORS: Record<string, string> = {
  early: '#34c759',  // 6-8 月：绿
  mid: '#007aff',    // 9-11 月：蓝
  late: '#af52de',   // 12+ 月：紫
};
const MONTH_DARK_COLORS: Record<string, string> = {
  early: '#5AB87A',
  mid: '#5A9AE8',
  late: '#B584E8',
};

function monthColorKey(min: number): 'early' | 'mid' | 'late' {
  if (min <= 8) return 'early';
  if (min <= 11) return 'mid';
  return 'late';
}

function formatMonthRange(min: number, max?: number): string {
  if (max) return `${min}-${max}月`;
  return `${min}月+`;
}

// 模块级徽章组件
function MonthBadge({ min, max, isDark }: { min: number; max?: number; isDark?: boolean }) {
  const key = monthColorKey(min);
  const clr = isDark ? MONTH_DARK_COLORS : MONTH_COLORS;
  return (
    <View style={{ paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: 6, backgroundColor: clr[key] + '20' }}>
      <Text style={{ ...typography.caption1, fontWeight: '700', fontSize: 11, color: clr[key] }}>{formatMonthRange(min, max)}</Text>
    </View>
  );
}

function AllergenTag({ label, isDark }: { label: string; isDark?: boolean }) {
  const isLow = label === LOW_ALLERGEN_LABEL;
  const clr = isLow
    ? (isDark ? LOW_ALLERGEN_DARK_COLOR : LOW_ALLERGEN_COLOR)
    : (isDark ? ALLERGEN_DARK_COLORS : ALLERGEN_COLORS)[label] || '#8e8e93';
  return (
    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6, backgroundColor: clr + '20' }}>
      <Text style={{ ...typography.caption2, fontWeight: '600', fontSize: 10, color: clr }}>{label}</Text>
    </View>
  );
}

function NutritionTag({ label, colorScheme }: { label: string; colorScheme: ReturnType<typeof useColors> }) {
  return (
    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6, backgroundColor: colorScheme.accentLight }}>
      <Text style={{ ...typography.caption2, fontWeight: '600', fontSize: 10, color: colorScheme.accent }}>{label}</Text>
    </View>
  );
}

export function BabyFoodRecipeTool({ expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const { state } = useApp();

  // 计算宝宝当前月龄
  const babyAgeMonths = useMemo(() => {
    const baby = state.babies.find(b => b.id === state.currentBabyId) || state.babies[0];
    if (state.stage !== 'postpartum' || !baby?.birthDate) return null;
    const birthDate = new Date(baby.birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birthDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  }, [state.stage, state.babies, state.currentBabyId]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeAllergen, setActiveAllergen] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasSearch = search.trim().length > 0;

  // 分类列表（从数据动态提取，保持稳定顺序）
  const ALL_CATEGORIES = useMemo(() => {
    const seen: string[] = [];
    for (const r of BABY_FOOD_RECIPES) {
      if (!seen.includes(r.category)) seen.push(r.category);
    }
    return seen;
  }, []);

  const filtered = useMemo(() => {
    let list = BABY_FOOD_RECIPES;

    // 月龄适配：minMonth <= 当前月龄
    if (ageFilter && babyAgeMonths !== null) {
      list = list.filter(r => r.minMonth <= babyAgeMonths);
    }

    // 过敏原筛选
    if (activeAllergen) {
      if (activeAllergen === LOW_ALLERGEN_LABEL) {
        list = list.filter(r => r.allergens.length === 0);
      } else {
        list = list.filter(r => r.allergens.includes(activeAllergen));
      }
    }

    // 分类筛选
    if (activeCategory) {
      list = list.filter(r => r.category === activeCategory);
    }

    // 搜索
    if (hasSearch) {
      const kw = search.trim().toLowerCase();
      const exact: BabyFoodRecipe[] = [];
      const fuzzy: BabyFoodRecipe[] = [];
      for (const r of list) {
        const match = r.name.toLowerCase().includes(kw)
          || r.ingredients.some(i => i.toLowerCase().includes(kw))
          || r.nutritionTags.some(t => t.toLowerCase().includes(kw));
        if (match) {
          if (r.name === kw || r.name.startsWith(kw)
            || r.ingredients.some(i => i.toLowerCase().startsWith(kw))) {
            exact.push(r);
          } else {
            fuzzy.push(r);
          }
        }
      }
      return [...exact, ...fuzzy].slice(0, 40);
    }

    // 无任何筛选条件时返回空（提示状态）
    return activeCategory || ageFilter || activeAllergen ? list : [];
  }, [search, activeCategory, activeAllergen, ageFilter, babyAgeMonths]);

  // 月龄筛选后隐藏的食谱数
  const ageFilterHiddenCount = useMemo(() => {
    if (!ageFilter || babyAgeMonths === null) return 0;
    return BABY_FOOD_RECIPES.filter(r => r.minMonth > babyAgeMonths).length;
  }, [ageFilter, babyAgeMonths]);

  const styles = useMemo(() => StyleSheet.create({
    container: { maxHeight: expanded ? undefined : 540 },
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
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 1,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      ...typography.caption1,
      fontWeight: '500',
      color: colors.fgSecondary,
    },
    chipTextActive: {
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
    sectionLabel: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
    },
    noAgeHint: {
      ...typography.footnote,
      color: colors.muted,
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
    recipeName: { ...typography.callout, fontWeight: '700', color: colors.fg, marginBottom: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs },
    categoryText: { ...typography.caption1, color: colors.accent, fontWeight: '500' },
    expandIcon: { padding: spacing.xs },
    section: { marginTop: spacing.md },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    sectionTitle: { ...typography.caption1, fontWeight: '700', color: colors.fg },
    ingredientList: { gap: 4 },
    ingredientItem: {
      ...typography.footnote, color: colors.fgSecondary, lineHeight: 20,
    },
    stepList: { gap: 8 },
    stepItem: { flexDirection: 'row', gap: spacing.sm },
    stepNum: {
      width: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
      marginTop: 1,
    },
    stepNumText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    stepText: { ...typography.footnote, color: colors.fgSecondary, lineHeight: 20, flex: 1 },
    tipBox: {
      backgroundColor: colors.accentLight,
      borderRadius: radius.sm,
      padding: spacing.md,
      marginTop: spacing.sm,
      borderLeftWidth: 2,
      borderLeftColor: colors.accent,
    },
    tipLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    tipLabel: { ...typography.caption1, fontWeight: '600', color: colors.accent },
    tipText: { ...typography.footnote, color: colors.fgSecondary, lineHeight: 18 },
    safetyHint: { ...typography.caption2, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
  }), [colors, expanded]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <TextInput
        style={styles.searchInput}
        placeholder="搜食谱名 / 食材 / 营养标签…"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={t => { setSearch(t); if (t) { setActiveCategory(null); setActiveAllergen(null); } }}
        autoFocus
      />

      {/* 分类筛选 */}
      <Text style={styles.sectionLabel}>食材分类</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={styles.chipRow}>
          {ALL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => {
                setActiveCategory(activeCategory === cat ? null : cat);
                if (activeCategory !== cat) setSearch('');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 过敏原筛选 */}
      <Text style={styles.sectionLabel}>过敏原</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={styles.chipRow}>
          {ALLERGEN_FILTERS.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.chip, activeAllergen === a && styles.chipActive]}
              onPress={() => {
                setActiveAllergen(activeAllergen === a ? null : a);
                if (activeAllergen !== a) setSearch('');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, activeAllergen === a && styles.chipTextActive]}>
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 按月龄筛选 */}
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
              仅看{babyAgeMonths}个月可加
            </Text>
            {ageFilter && (
              <View style={styles.ageFilterBadge}>
                <Text style={styles.ageFilterBadgeText}>隐藏{ageFilterHiddenCount}道</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
            <Text style={styles.noAgeHint}>填写宝宝出生日期后可按月龄筛选</Text>
          </View>
        )}

        {(hasSearch || activeCategory || activeAllergen || ageFilter) && (
          <Text style={{ ...typography.caption1, color: colors.muted }}>
            共 {filtered.length} 道
          </Text>
        )}
      </View>

      {/* 提示 */}
      {!(hasSearch || activeCategory || activeAllergen || ageFilter) && (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
          <Ionicons name="nutrition-outline" size={24} color={colors.muted} style={{ opacity: 0.5 }} />
          <Text style={{ ...typography.footnote, color: colors.muted, textAlign: 'center' }}>
            搜索食谱或选择分类/月龄查看
          </Text>
          <Text style={{ ...typography.caption2, color: colors.muted, textAlign: 'center' }}>
            新食材每次只加一种，观察 3 天无过敏反应再加下一种
          </Text>
        </View>
      )}

      {(hasSearch || activeCategory || activeAllergen || ageFilter) && filtered.length === 0 && (
        <Text style={styles.empty}>未找到符合条件的食谱</Text>
      )}

      {filtered.map(recipe => {
        const isExpanded = expandedId === recipe.id;
        const allergenLabels = recipe.allergens.length > 0 ? recipe.allergens : [LOW_ALLERGEN_LABEL];
        return (
          <View key={recipe.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpandedId(isExpanded ? null : recipe.id);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.nameRow}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.categoryText}>{recipe.category}</Text>
                <View style={styles.metaRow}>
                  <MonthBadge min={recipe.minMonth} max={recipe.maxMonth} isDark={isDark} />
                  {allergenLabels.map(label => (
                    <AllergenTag key={label} label={label} isDark={isDark} />
                  ))}
                  {recipe.nutritionTags.map(tag => (
                    <NutritionTag key={tag} label={tag} colorScheme={colors} />
                  ))}
                </View>
              </View>
              <View style={styles.expandIcon}>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <>
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="restaurant-outline" size={14} color={colors.accent} />
                    <Text style={styles.sectionTitle}> 食材</Text>
                  </View>
                  <View style={styles.ingredientList}>
                    {recipe.ingredients.map((ing, idx) => (
                      <Text key={idx} style={styles.ingredientItem}>• {ing}</Text>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="chatbubbles-outline" size={14} color={colors.accent} />
                    <Text style={styles.sectionTitle}> 步骤</Text>
                  </View>
                  <View style={styles.stepList}>
                    {recipe.steps.map((step, idx) => (
                      <View key={idx} style={styles.stepItem}>
                        <View style={styles.stepNum}>
                          <Text style={styles.stepNumText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {recipe.tip && (
                  <View style={styles.tipBox}>
                    <View style={styles.tipLabelRow}>
                      <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                      <Text style={styles.tipLabel}> 小贴士</Text>
                    </View>
                    <Text style={styles.tipText}>{recipe.tip}</Text>
                  </View>
                )}

                <Text style={styles.safetyHint}>以上信息仅供参考，添加辅食请结合宝宝实际发育</Text>
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

export default BabyFoodRecipeTool;
