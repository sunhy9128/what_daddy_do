import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';
import { getPresetItems, getUserPreparations, setUserPreparation } from '../../lib/api';
import { PresetItem, UserPreparation } from '../../lib/supabase';
import { LoadingDot } from './ToolBase';

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  '妈妈用品': 'woman-outline',
  '喂养': 'cafe-outline',
  '洗护': 'water-outline',
  '衣物': 'shirt-outline',
  '睡眠': 'moon-outline',
  '出行': 'car-outline',
  '医疗': 'medkit-outline',
  '产后恢复': 'fitness-outline',
  '其他': 'ellipsis-horizontal-outline',
};

const LEVEL_LABELS: Record<string, string> = {
  essential: '必需',
  recommended: '推荐',
  optional: '可选',
};

const LEVEL_STYLES = {
  essential: { bg: '#ff3b3020', text: '#ff3b30' },
  recommended: { bg: '#ff9f0a20', text: '#ff9f0a' },
  optional: { bg: '#8e8e9320', text: '#8e8e93' },
};

export function HospitalBag({ userId, expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const [items, setItems] = useState<PresetItem[]>([]);
  const [preparations, setPreparations] = useState<Record<string, UserPreparation>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const [allItems, preps] = await Promise.all([
          getPresetItems('third'),
          getUserPreparations(userId),
        ]);
        setItems(allItems);
        const prepMap: Record<string, UserPreparation> = {};
        for (const p of preps) prepMap[p.item_id] = p;
        setPreparations(prepMap);
      } catch (e) {
        console.error('HospitalBag load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // 按 category 分组
  const categories = useMemo(() => {
    const map = new Map<string, PresetItem[]>();
    for (const item of items) {
      const cat = item.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  // 当前 category 列表
  const catKeys = useMemo(() => categories.map(([k]) => k), [categories]);

  // 选中的分类下的物品，或全部
  const displayedItems = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter(i => i.category === activeCategory);
  }, [items, activeCategory]);

  // 统计
  const totalCount = items.length;
  const preparedCount = useMemo(() => {
    let n = 0;
    for (const item of items) {
      if (preparations[item.id]?.status === 'prepared') n++;
    }
    return n;
  }, [items, preparations]);
  const progress = totalCount > 0 ? preparedCount / totalCount : 0;

  const isPrepared = useCallback((id: string) => preparations[id]?.status === 'prepared', [preparations]);

  const handleToggle = useCallback(async (itemId: string) => {
    if (togglingId) return;
    setTogglingId(itemId);
    try {
      const current = isPrepared(itemId);
      const newStatus = current ? 'not_prepared' : 'prepared';
      const result = await setUserPreparation(userId, itemId, newStatus);
      setPreparations(prev => ({ ...prev, [itemId]: result }));
    } catch (e) {
      console.error('HospitalBag toggle error:', e);
    } finally {
      setTogglingId(null);
    }
  }, [userId, isPrepared, togglingId]);

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { maxHeight: expanded ? undefined : 480 },
    loadingWrap: { flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl },
    emptyWrap: { paddingVertical: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.callout, color: colors.muted },
    progressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
    },
    progressInfo: { flex: 1 },
    progressLabel: { ...typography.footnote, fontWeight: '600', color: colors.fg },
    progressDetail: { ...typography.caption2, color: colors.muted, marginTop: 2 },
    progressBar: { marginTop: spacing.sm, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
    progressPct: { ...typography.title2, fontWeight: '700', color: colors.accent },

    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
    catChip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    catChipText: { ...typography.caption1, color: colors.fgSecondary },
    catChipTextActive: { color: '#fff', fontWeight: '600' },

    scroller: { maxHeight: expanded ? undefined : 360 },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    itemCheckbox: {
      width: 24, height: 24, borderRadius: 12,
      borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
      marginTop: 2,
    },
    itemCheckboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    itemInfo: { flex: 1 },
    itemNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: 2 },
    itemName: { ...typography.callout, fontWeight: '500', color: colors.fg, flex: 1 },
    itemNameDone: { color: colors.muted, textDecorationLine: 'line-through' },
    itemLevel: { ...typography.caption2, fontWeight: '600', fontSize: 10, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
    itemDesc: { ...typography.footnote, color: colors.fgSecondary, lineHeight: 18, marginBottom: 2 },
    itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
    itemMetaTag: { ...typography.caption2, color: colors.muted, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
  }), [colors, expanded]);

  if (loading) {
    return (
      <View style={[styles.wrapper, { minHeight: 100 }]}>
        <View style={styles.loadingWrap}>
          <LoadingDot delay={0} />
          <LoadingDot delay={200} />
          <LoadingDot delay={400} />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.wrapper, { minHeight: 60 }]}>
        <View style={styles.emptyWrap}>
          <Ionicons name="bag-check-outline" size={24} color={colors.muted} />
          <Text style={styles.emptyText}>暂无待产物品数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* 进度卡片 */}
      <View style={styles.progressCard}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>待产包准备</Text>
          <Text style={styles.progressDetail}>已准备 {preparedCount}/{totalCount} 件</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
        <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
      </View>

      {/* 分类过滤 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={{ flexDirection: 'row', gap: spacing.xs }}>
        <TouchableOpacity
          style={[styles.catChip, activeCategory === null && styles.catChipActive]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.catChipText, activeCategory === null && styles.catChipTextActive]}>全部</Text>
        </TouchableOpacity>
        {catKeys.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 物品列表 */}
      <ScrollView style={styles.scroller} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {displayedItems.map(item => {
          const done = isPrepared(item.id);
          const level = item.essential_level;
          const ls = LEVEL_STYLES[level];
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => handleToggle(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.itemCheckbox, done && styles.itemCheckboxActive]}>
                {done && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                  <Text style={[styles.itemName, done && styles.itemNameDone]} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.itemLevel, { backgroundColor: ls.bg, color: ls.text }]}>{LEVEL_LABELS[level]}</Text>
                </View>
                {item.description ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.itemMeta}>
                  <Text style={styles.itemMetaTag}>{item.category}</Text>
                  {item.quantity_suggestion ? (
                    <Text style={styles.itemMetaTag}>{item.quantity_suggestion}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default HospitalBag;
