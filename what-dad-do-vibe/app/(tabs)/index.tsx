import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { ToolGrid } from '../../src/components/tools/ToolGrid';
import { loadActiveTools, saveActiveTools } from '../../src/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuideOverlay } from '../../src/components/GuideOverlay';
import { useAuth } from '../../src/context/AuthContext';
import { getPresetItemsByPeriods, getUserPreparations, setUserPreparation, getPsychologicalSupportByPeriods } from '../../src/lib/api';
import { PresetItem, UserPreparation, PsychologicalSupport } from '../../src/lib/supabase';
import { CollapsibleGroup } from '../../src/components/organisms';

import { useColors } from '../../src/context/ThemeContext';
import { spacing, typography, radius } from '../../src/styles/tokens';

import { STAGES } from '../../src/lib/stages';
import { BUMP_SIZE_DATA } from '../../src/lib/bump-size-data';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, dismissUrgentNote, addUrgentNote } = useApp();
  const { session, loading: authLoading, user } = useAuth();
  const router = useRouter();

  // 开发阶段：每次进入首页都检测是否显示恭喜页面
  useEffect(() => {
    if (!session || !state.babies[0]) return;
    const baby = state.babies[0];
    if (baby.gender) return; // 已确认性别，跳过
    router.replace('/congratulations');
  }, [session, state.babies]);

  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentText, setUrgentText] = useState('');
  const [urgentLoading, setUrgentLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<{ instanceId: string; toolId: string }[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  // 引导页目标元素 ref（用于 spotlight 挖空位置）
  const urgentRef = useRef<View>(null);
  const prepRef = useRef<View>(null);
  const supportRef = useRef<View>(null);
  const toolsRef = useRef<View>(null);
  const colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  notLoggedIn: { ...typography.callout, color: colors.fgSecondary },
  loginLink: { ...typography.callout, color: colors.accent, fontWeight: '600' },

  // Header
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  greeting: { ...typography.footnote, color: colors.muted, marginBottom: spacing.xs },
  stageText: { ...typography.title1, fontWeight: '700' },
  stageRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  weekText: { ...typography.callout, color: colors.accent, fontWeight: '500' },

  // 紧急关注
  urgentSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  urgentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  urgentBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  urgentText: {
    ...typography.callout,
    color: '#991B1B',
    lineHeight: 22,
    flexShrink: 1,
  },
  urgentClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  urgentCloseText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '400',
  },
  urgentAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md - 2,
    gap: spacing.sm,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  urgentAddIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  urgentAddText: {
    ...typography.callout,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 紧急关注弹窗
  urgentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  urgentModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  urgentModalTitle: {
    ...typography.title3,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  urgentModalInput: {
    ...typography.callout,
    color: colors.fg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  urgentModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  urgentModalCancel: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  urgentModalCancelText: {
    ...typography.callout,
    color: colors.muted,
  },
  urgentModalSave: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  urgentModalSaveDisabled: {
    opacity: 0.5,
  },
  urgentModalSaveText: {
    ...typography.callout,
    fontWeight: '600',
    color: '#fff',
  },

  // ===== 宝宝大小对比 =====
  bumpCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  bumpHeader: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bumpTitle: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.accent,
  },
  bumpBody: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  bumpEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  bumpFruit: {
    ...typography.title2,
    fontWeight: '700',
    color: colors.fg,
    marginBottom: spacing.xs,
  },
  bumpWeek: {
    ...typography.subhead,
    color: colors.fgSecondary,
    marginBottom: spacing.md,
  },
  bumpMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  bumpMetaItem: {
    alignItems: 'center',
  },
  bumpMetaLabel: {
    ...typography.caption2,
    color: colors.muted,
    marginBottom: 2,
  },
  bumpMetaValue: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
  },
  bumpMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  bumpDesc: {
    ...typography.footnote,
    color: colors.fgSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },

  // ===== 物品准备样式 =====
  prepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 10,
  },
  prepItemDone: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.divider,
  },
  prepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
    backgroundColor: colors.bg,
  },
  prepCheckboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  prepCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  prepInfo: { flex: 1 },
  prepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  prepName: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
    flex: 1,
    lineHeight: 21,
  },
  prepNameDone: { color: colors.muted, textDecorationLine: 'line-through' },
  prepLevel: {
    ...typography.caption2,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },
  prepLevelEssential: { color: '#fff', backgroundColor: colors.accent },
  prepLevelRecommended: { color: colors.accent, backgroundColor: colors.accentLight, borderWidth: 0.5, borderColor: colors.accent + '40' },
  prepLevelOptional: { color: colors.muted, backgroundColor: 'transparent' },
  prepDesc: {
    ...typography.footnote,
    color: colors.fgSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  prepDescDone: { color: colors.muted },
  prepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  prepMetaCategory: {
    ...typography.caption2,
    color: colors.muted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  prepMetaQty: {
    ...typography.caption2,
    color: colors.fgSecondary,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },

  // ===== 心理支持样式 =====
  supportCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 10,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  supportTitle: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
    flex: 1,
    lineHeight: 22,
  },
  supportTypeBadge: {
    ...typography.caption2,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },
  supportTypeEmotion: { color: '#fff', backgroundColor: colors.accent },
  supportTypeCommunication: { color: colors.accent, backgroundColor: colors.accentLight, borderWidth: 0.5, borderColor: colors.accent + '40' },
  supportTypeAction: { color: '#fff', backgroundColor: colors.warning },
  supportTypeKnowledge: { color: colors.muted, backgroundColor: 'transparent', borderWidth: 0.5, borderColor: colors.border },
  supportContentBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accentLight,
    paddingLeft: spacing.md,
    marginBottom: spacing.md,
  },
  supportContent: {
    ...typography.subhead,
    color: colors.fgSecondary,
    lineHeight: 24,
  },
  supportTips: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.divider,
  },
  supportTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  supportTipIndex: {
    ...typography.caption2,
    color: colors.accent,
    fontWeight: '600',
    width: 22,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  supportTipText: {
    ...typography.footnote,
    color: colors.fg,
    lineHeight: 21,
    flex: 1,
  },

}), [colors]);

  // 物品准备 + 心理支持
  const [presetItems, setPresetItems] = useState<PresetItem[]>([]);
  const [userPreparations, setUserPreparations] = useState<UserPreparation[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [supportTips, setSupportTips] = useState<PsychologicalSupport[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  const periods = [state.stage];
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingItems(true);
      setLoadingSupport(true);
      try {
        const [items, support, preps] = await Promise.all([
          getPresetItemsByPeriods(periods),
          getPsychologicalSupportByPeriods(periods),
          getUserPreparations(user.id),
        ]);
        setPresetItems(items);
        setSupportTips(support);
        setUserPreparations(preps);
      } catch (e) {
        console.error('Failed to load items/support:', e);
      } finally {
        setLoadingItems(false);
        setLoadingSupport(false);
      }
    })();
  }, [user, state.stage]);

  const handleToggleItem = async (itemId: string) => {
    if (!user) return;
    const existing = userPreparations.find(p => p.item_id === itemId);
    const newStatus = existing?.status === 'prepared' ? 'not_prepared' : 'prepared';
    try {
      const updated = await setUserPreparation(user.id, itemId, newStatus);
      setUserPreparations(prev => {
        const filtered = prev.filter(p => p.item_id !== itemId);
        return [...filtered, updated];
      });
    } catch (e) {
      console.error('Failed to update item:', e);
    }
  };

  // 首次登录引导
  useEffect(() => {
    if (!user) return;
    loadActiveTools(user.id).then(tools => setActiveTools(tools));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const shown = await AsyncStorage.getItem(`guide_shown_${user.id}`);
        if (!shown) setShowGuide(true);
      } catch {}
    })();
  }, [user]);

  const dismissGuide = async () => {
    setShowGuide(false);
    try {
      await AsyncStorage.setItem(`guide_shown_${user?.id || ''}`, '1');
    } catch {}
  };

  const activeToolsRef = useRef(activeTools);
  activeToolsRef.current = activeTools;
  useEffect(() => {
    if (!user) return;
    saveActiveTools(user.id, activeToolsRef.current);
  }, [activeTools, user]);

  if (authLoading || state.loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.notLoggedIn}>请先登录</Text>
        <Link href="/login">
          <Text style={styles.loginLink}>去登录</Text>
        </Link>
      </View>
    );
  }

  const stageLabel = STAGES.find(s => s.key === state.stage)?.label || '孕晚期';
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>准爸爸，你好 👋</Text>
          <View style={styles.stageRow}>
            <Text style={styles.stageText}>{stageLabel}</Text>
            {state.babies.length > 0 && (
              <Text style={styles.weekText}>
                {state.stage === 'postpartum' ? state.birthAgeLabel : `第 ${state.weeksPregnant} 周`}
              </Text>
            )}
          </View>
        </View>

        {/* 紧急关注 */}
        <View ref={urgentRef} style={styles.urgentSection} collapsable={false}>
          {state.urgentNotes.map(note => (
            <View key={note.id} style={styles.urgentCard}>
              <View style={styles.urgentBody}>
                <View style={styles.urgentDot} />
                <Text style={styles.urgentText}>{note.content}</Text>
              </View>
              <TouchableOpacity
                style={styles.urgentClose}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm('关闭后将不再展示，确定要关闭吗？')) {
                      dismissUrgentNote(note.id);
                    }
                  } else {
                    Alert.alert(
                      '关闭提醒',
                      '关闭后将不再展示，确定要关闭吗？',
                      [
                        { text: '取消', style: 'cancel' },
                        { text: '确定关闭', style: 'destructive', onPress: () => dismissUrgentNote(note.id) },
                      ]
                    );
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.urgentCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {/* 新增按钮 */}
          <TouchableOpacity style={styles.urgentAddBtn} onPress={() => { setUrgentText(''); setShowUrgentModal(true); }}>
            <Text style={styles.urgentAddIcon}>+</Text>
            <Text style={styles.urgentAddText}>新增紧急关注</Text>
          </TouchableOpacity>
        </View>

        {/* ===== 宝宝大小对比 ===== */}
        {state.stage !== 'preconception' && state.stage !== 'postpartum' && state.weeksPregnant > 0 && (
          <View style={styles.bumpCard}>
            <View style={styles.bumpHeader}>
              <Text style={styles.bumpTitle}>宝宝现在多大？</Text>
            </View>
            <View style={styles.bumpBody}>
              <Text style={styles.bumpEmoji}>
                {(() => {
                  const entry = BUMP_SIZE_DATA.reduce((best, curr) =>
                    !best || Math.abs(curr.week - state.weeksPregnant) < Math.abs(best.week - state.weeksPregnant) ? curr : best
                  , null as typeof BUMP_SIZE_DATA[0] | null);
                  return entry?.emoji || '🫐';
                })()}
              </Text>
              {(() => {
                const entry = BUMP_SIZE_DATA.reduce((best, curr) =>
                  !best || Math.abs(curr.week - state.weeksPregnant) < Math.abs(best.week - state.weeksPregnant) ? curr : best
                , null as typeof BUMP_SIZE_DATA[0] | null);
                if (!entry) return null;
                return (
                  <>
                    <Text style={styles.bumpFruit}>像 {entry.fruit} 一样大</Text>
                    <Text style={styles.bumpWeek}>第 {state.weeksPregnant} 周</Text>
                    <View style={styles.bumpMeta}>
                      <View style={styles.bumpMetaItem}>
                        <Text style={styles.bumpMetaLabel}>身长</Text>
                        <Text style={styles.bumpMetaValue}>{entry.lengthCm} cm</Text>
                      </View>
                      <View style={styles.bumpMetaDivider} />
                      <View style={styles.bumpMetaItem}>
                        <Text style={styles.bumpMetaLabel}>体重</Text>
                        <Text style={styles.bumpMetaValue}>{entry.weightG} g</Text>
                      </View>
                    </View>
                    <Text style={styles.bumpDesc}>{entry.description}</Text>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        {/* ===== 物品准备 ===== */}
        {presetItems.length > 0 && (
          <CollapsibleGroup containerRef={prepRef} title="物品准备" count={presetItems.length} defaultExpanded={false}>
            {presetItems.map(item => {
              const prep = userPreparations.find(p => p.item_id === item.id);
              const isPrepared = prep?.status === 'prepared';
              const level = item.essential_level;
              const levelLabel = level === 'essential' ? '必需' : level === 'recommended' ? '推荐' : '可选';
              const levelStyle = level === 'essential' ? styles.prepLevelEssential : level === 'recommended' ? styles.prepLevelRecommended : styles.prepLevelOptional;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.prepItem, isPrepared && styles.prepItemDone]}
                  onPress={() => handleToggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.prepCheckbox, isPrepared && styles.prepCheckboxActive]}>
                    {isPrepared && <Text style={styles.prepCheckmark}>✓</Text>}
                  </View>
                  <View style={styles.prepInfo}>
                    <View style={styles.prepHeaderRow}>
                      <Text style={[styles.prepName, isPrepared && styles.prepNameDone]} numberOfLines={2}>{item.name}</Text>
                      <Text style={[styles.prepLevel, levelStyle]}>{levelLabel}</Text>
                    </View>
                    {item.description && (
                      <Text style={[styles.prepDesc, isPrepared && styles.prepDescDone]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View style={styles.prepMeta}>
                      <Text style={styles.prepMetaCategory}>{item.category}</Text>
                      {item.quantity_suggestion && (
                        <Text style={styles.prepMetaQty}>{item.quantity_suggestion}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </CollapsibleGroup>
        )}

        {/* ===== 心理支持 ===== */}
        {supportTips.length > 0 && (
          <CollapsibleGroup containerRef={supportRef} title="心理支持" count={supportTips.length} defaultExpanded={false}>
            {supportTips.map(tip => {
              const typeLabel = tip.support_type === 'emotion' ? '情绪' : tip.support_type === 'communication' ? '沟通' : tip.support_type === 'action' ? '行动' : '知识';
              const badgeStyle = tip.support_type === 'emotion' ? styles.supportTypeEmotion
                : tip.support_type === 'communication' ? styles.supportTypeCommunication
                : tip.support_type === 'action' ? styles.supportTypeAction
                : styles.supportTypeKnowledge;

              return (
                <View key={tip.id} style={styles.supportCard}>
                  <View style={styles.supportHeader}>
                    <Text style={styles.supportTitle} numberOfLines={2}>{tip.title}</Text>
                    <Text style={[styles.supportTypeBadge, badgeStyle]}>{typeLabel}</Text>
                  </View>
                  <View style={styles.supportContentBlock}>
                    <Text style={styles.supportContent}>{tip.content}</Text>
                  </View>
                  {tip.tips && tip.tips.length > 0 && (
                    <View style={styles.supportTips}>
                      {tip.tips.map((t, i) => (
                        <View key={i} style={styles.supportTipRow}>
                          <Text style={styles.supportTipIndex}>{String(i + 1).padStart(2, '0')}</Text>
                          <Text style={styles.supportTipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </CollapsibleGroup>
        )}

        {/* ===== 工具箱九宫格 ===== */}
        <View ref={toolsRef} collapsable={false}>
          <ToolGrid
            tools={activeTools}
            onToolPress={(toolId) => router.push(`/tool-detail?toolId=${toolId}`)}
            onAddTool={(toolId) => {
              if (activeTools.some(t => t.toolId === toolId)) return;
              setActiveTools(prev => [...prev, { instanceId: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, toolId }]);
            }}
            onRemoveTool={(instanceId) => setActiveTools(prev => prev.filter(t => t.instanceId !== instanceId))}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 新增紧急关注弹窗 */}
      <Modal visible={showUrgentModal} animationType="fade" transparent>
        <View style={styles.urgentModalOverlay}>
          <View style={styles.urgentModalContent}>
            <Text style={styles.urgentModalTitle}>新增紧急关注</Text>
            <TextInput
              style={styles.urgentModalInput}
              placeholder="如：观察明天是否还有红疹"
              placeholderTextColor={colors.muted}
              value={urgentText}
              onChangeText={setUrgentText}
              multiline
              autoFocus
            />
            <View style={styles.urgentModalActions}>
              <TouchableOpacity
                style={styles.urgentModalCancel}
                onPress={() => setShowUrgentModal(false)}
              >
                <Text style={styles.urgentModalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.urgentModalSave, (!urgentText.trim() || urgentLoading) && styles.urgentModalSaveDisabled]}
                onPress={async () => {
                  if (!urgentText.trim()) return;
                  setUrgentLoading(true);
                  try {
                    await addUrgentNote(urgentText.trim());
                    setUrgentText('');
                    setShowUrgentModal(false);
                  } finally {
                    setUrgentLoading(false);
                  }
                }}
                disabled={!urgentText.trim() || urgentLoading}
              >
                {urgentLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.urgentModalSaveText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 首次引导 */}
      {showGuide && (
        <GuideOverlay
          onDismiss={dismissGuide}
          targets={{ urgent: urgentRef, prep: prepRef, support: supportRef, tools: toolsRef }}
        />
      )}
    </View>
  );
}
