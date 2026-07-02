import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { ToolGrid } from '../../src/components/tools/ToolGrid';
import { BabySwitcher } from '../../src/components/BabySwitcher';
import { loadActiveTools, saveActiveTools } from '../../src/lib/storage';
import { useAuth } from '../../src/context/AuthContext';
import { getPresetItemsByPeriods, getUserPreparations, setUserPreparation, getPsychologicalSupportByPeriods } from '../../src/lib/api';
import { PresetItem, UserPreparation, PsychologicalSupport } from '../../src/lib/supabase';
import { CollapsibleGroup } from '../../src/components/organisms';
import Card from '../../src/components/atoms/Card';

import { useColors, useTheme } from '../../src/context/ThemeContext';
import { spacing, typography, radius } from '../../src/styles/tokens';

import { STAGES } from '../../src/lib/stages';
import { BUMP_SIZE_DATA } from '../../src/lib/bump-size-data';

const PAGE_WIDTH = Dimensions.get('window').width - spacing.lg * 2;
// CollapsibleGroup 内容区实际宽度 = PAGE_WIDTH - paddingHorizontal(sm*2)
const CONTENT_WIDTH = PAGE_WIDTH - spacing.sm * 2;
const ITEMS_PER_PAGE = 5; // 每页显示5个
const ITEM_GAP = spacing.xs; // 物品间距
// 每个物品宽度：(内容区宽度 - 间距) / 每行物品数
const ITEM_WIDTH = (CONTENT_WIDTH - ITEM_GAP * (ITEMS_PER_PAGE - 1)) / ITEMS_PER_PAGE;
// 每行一个物品的垂直列表布局
const ROW_ITEM_WIDTH = CONTENT_WIDTH;

const DAILY_TIPS: Record<string, string[]> = {
  preconception: [
    '备孕期间，准爸爸补充叶酸和锌，有助于提高精子质量。',
    '戒烟戒酒至少3个月，给宝宝一个健康的开始。',
    '避免泡温泉、蒸桑拿，高温会影响精子活力。',
    '保持规律作息，每晚睡够7-8小时。',
    '多吃富含锌的食物，如瘦肉、海鲜、坚果。',
    '和准妈妈一起做孕前体检，了解双方身体状况。',
    '避免久坐，每小时起来活动5-10分钟。',
    '保持心情愉悦，压力太大会影响受孕几率。',
  ],
  first: [
    '孕早期宝宝神经系统快速发育，爸爸要多陪准妈妈散步。',
    '为准妈妈准备清淡易消化的食物，少食多餐。',
    '陪准妈妈一起听产检结果，给她安全感。',
    '孕早期避免性生活，减少流产风险。',
    '陪准妈妈记录怀孕日记，留下美好回忆。',
    '为准妈妈准备缓解孕吐的小零食，如姜糖。',
    '学习孕期知识，了解这个阶段需要注意什么。',
    '给准妈妈多一些拥抱和安慰，她可能情绪波动。',
  ],
  second: [
    '孕中期是宝宝大脑发育黄金期，多和宝宝说话。',
    '陪准妈妈做孕期瑜伽，增进感情又锻炼身体。',
    '孕中期可以开始准备宝宝用品了列个清单。',
    '每天花10分钟抚摸准妈妈的肚子，感受胎动。',
    '陪准妈妈数胎动，这是了解宝宝健康的好方法。',
    '孕中期睡眠质量可能下降，帮她准备孕妇枕。',
    '可以开始给宝宝讲故事，进行语言胎教。',
    '陪准妈妈拍照记录孕肚，留下珍贵纪念。',
  ],
  third: [
    '准备好待产包，放在车里随时可以出发。',
    '学习拉玛泽呼吸法，分娩时能帮到准妈妈。',
    '了解分娩信号：见红、破水、规律宫缩。',
    '和准妈妈讨论分娩计划，了解她的意愿。',
    '提前规划去医院的路线和时间。',
    '陪准妈妈练习分娩姿势，减轻分娩疼痛。',
    '给宝宝准备安全的婴儿床和寝具。',
    '准备好产后照顾妈妈和宝宝的一切。',
  ],
  postpartum: [
    '宝宝哭闹时，爸爸的安抚声有独特效果。',
    '换尿布时，用棉柔巾从前往后擦更干净。',
    '喂奶后记得拍嗝，竖抱10-15分钟效果好。',
    '每天给宝宝做抚触，促进发育又增进感情。',
    '记录宝宝的吃奶、睡眠、排便规律。',
    '让妈妈多休息，你来承担更多护理工作。',
    '多和宝宝说话、唱歌，促进语言发育。',
    '不要忽视妈妈的情绪，给她足够的关心。',
  ],
};

function getDailyTip(stage: string): string {
  const tips = DAILY_TIPS[stage] || DAILY_TIPS.preconception;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return tips[dayOfYear % tips.length];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, dismissUrgentNote, addUrgentNote } = useApp();
  const { session, loading: authLoading, user } = useAuth();
  const router = useRouter();

  // 检测已出生但未确认性别的宝宝，跳转恭喜页面
  useEffect(() => {
    if (!session || !state.currentBabyId) return;
    if (state.stage !== 'postpartum') return;
    const baby = state.babies.find(b => b.id === state.currentBabyId);
    if (!baby || baby.gender) return;
    router.replace(`/congratulations?babyId=${baby.id}`);
  }, [session, state.currentBabyId, state.babies, state.stage]);

  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentText, setUrgentText] = useState('');
  const [urgentLoading, setUrgentLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<{ instanceId: string; toolId: string }[]>([]);

  const colors = useColors();
  const { isDark } = useTheme();

  // 下次产检倒计时
  const nextPrenatal = useMemo(() => {
    if (state.stage === 'postpartum' || state.stage === 'preconception') return null;
    const upcoming = state.tasks
      .filter(t => t.type === 'prenatal' && !t.isCompleted && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    return upcoming[0] || null;
  }, [state.tasks, state.stage]);

  const daysUntilNextPrenatal = useMemo(() => {
    if (!nextPrenatal?.dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(nextPrenatal.dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextPrenatal]);

  const dailyTip = useMemo(() => getDailyTip(state.stage), [state.stage]);

  const styles = useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  notLoggedIn: { ...typography.callout, color: colors.fgSecondary },
  loginLink: { ...typography.callout, color: colors.accent, fontWeight: '600' },

  // Header
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  greeting: { ...typography.footnote, color: colors.muted, marginBottom: spacing.xs },
  stageText: { ...typography.title1, fontWeight: '700', color: colors.fg },
  stageRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  weekText: { ...typography.callout, color: colors.accent, fontWeight: '500' },
  stageMotto: {
    ...typography.subhead,
    color: colors.fgSecondary,
    marginTop: spacing.xs,
    lineHeight: 22,
  },

  // 每日小贴士
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    overflow: 'hidden',
  },
  tipBody: {
    flex: 1,
    padding: spacing.md,
  },
  tipLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  tipLabel: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tipLabelText: {
    ...typography.caption2,
    fontWeight: '600',
    color: '#fff',
  },
  tipText: {
    ...typography.footnote,
    color: colors.fg,
    lineHeight: 20,
  },

  // 紧急关注
  urgentSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  urgentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
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
    backgroundColor: colors.error,
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  urgentText: {
    ...typography.callout,
    color: colors.dangerFg,
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
    color: colors.error,
    fontWeight: '400',
  },
  urgentAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md - 2,
    gap: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: 12,
    shadowColor: colors.error,
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
    color: colors.fg,
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
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  bumpEmojiCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  bumpEmoji: {
    fontSize: 52,
  },
  bumpInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bumpFruitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bumpFruit: {
    ...typography.title3,
    fontWeight: '700',
    color: colors.fg,
  },
  bumpWeek: {
    ...typography.subhead,
    color: colors.fgSecondary,
  },
  bumpMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  bumpMetaItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  bumpMetaLabel: {
    ...typography.caption2,
    color: colors.muted,
  },
  bumpMetaValue: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
  },
  bumpMetaDivider: {
    width: 12,
    height: 14,
    backgroundColor: colors.border,
    flexShrink: 0,
  },
  bumpDesc: {
    ...typography.footnote,
    color: colors.fgSecondary,
    lineHeight: 18,
  },

  // ===== 下次产检倒计时 =====
  checkupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  checkupHeader: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkupHeaderTitle: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 0.3,
  },
  checkupBody: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  checkupIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkupInfo: {
    flex: 1,
  },
  checkupLabel: {
    ...typography.caption2,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  checkupName: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
  },
  checkupCountdownWrap: {
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 64,
  },
  checkupCountdownUrgent: {
    backgroundColor: colors.dangerSurface,
  },
  checkupCountdownSoon: {
    backgroundColor: colors.warningSurface,
  },
  checkupDaysNum: {
    ...typography.title2,
    fontWeight: '700',
    color: colors.accent,
  },
  checkupDaysUrgent: {
    color: colors.error,
  },
  checkupDaysSoon: {
    color: colors.warning,
  },
  checkupDaysLabel: {
    ...typography.caption2,
    color: colors.muted,
    marginTop: 1,
  },
  checkupDaysLabelUrgent: {
    color: colors.error,
  },
  checkupDesc: {
    ...typography.footnote,
    color: colors.fgSecondary,
    lineHeight: 20,
    marginTop: spacing.md,
    marginLeft: 0,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  checkupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  checkupHint: {
    ...typography.caption2,
    color: colors.muted,
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
    backgroundColor: 'transparent',
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

  // ===== 物品/支持分页样式 =====
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, borderRadius: 4, backgroundColor: colors.accent },
  pageBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pageBtnDisabled: { opacity: 0.25 },
  // 物品/支持项单列布局（每页5行）
  itemGrid: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    gap: ITEM_GAP,
  },
  itemCard: {
    width: ROW_ITEM_WIDTH,
  },

}), [colors, isDark]);

  // 物品准备 + 心理支持
  const [presetItems, setPresetItems] = useState<PresetItem[]>([]);
  const [userPreparations, setUserPreparations] = useState<UserPreparation[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [supportTips, setSupportTips] = useState<PsychologicalSupport[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  // 分页状态
  const [prepPageIndex, setPrepPageIndex] = useState(0);
  const [supportPageIndex, setSupportPageIndex] = useState(0);
  const prepFlatListRef = useRef<FlatList>(null);
  const supportFlatListRef = useRef<FlatList>(null);
  const prepProgrammatic = useRef(false);
  const supportProgrammatic = useRef(false);

  // 心理支持详情弹窗
  const [selectedTip, setSelectedTip] = useState<PsychologicalSupport | null>(null);

  // 预分页数据：每页 ITEMS_PER_PAGE 个物品
  const prepPages = useMemo(() => {
    const pages: PresetItem[][] = [];
    for (let i = 0; i < presetItems.length; i += ITEMS_PER_PAGE) {
      pages.push(presetItems.slice(i, i + ITEMS_PER_PAGE));
    }
    return pages;
  }, [presetItems]);

  const supportPages = useMemo(() => {
    const pages: PsychologicalSupport[][] = [];
    for (let i = 0; i < supportTips.length; i += ITEMS_PER_PAGE) {
      pages.push(supportTips.slice(i, i + ITEMS_PER_PAGE));
    }
    return pages;
  }, [supportTips]);

  const prepPageCount = prepPages.length;
  const supportPageCount = supportPages.length;

  // 分页滚动处理（跳过程序化滚动触发的回调）
  const onPrepScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (prepProgrammatic.current) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / CONTENT_WIDTH);
    if (newIndex >= 0 && newIndex < prepPageCount) {
      setPrepPageIndex(newIndex);
    }
  }, [prepPageCount]);

  // 滚动结束/拖拽结束时同步指示器
  const onPrepMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / CONTENT_WIDTH);
    if (newIndex >= 0 && newIndex < prepPageCount) {
      setPrepPageIndex(newIndex);
    }
    prepProgrammatic.current = false;
  }, [prepPageCount]);

  const onSupportScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (supportProgrammatic.current) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / CONTENT_WIDTH);
    if (newIndex >= 0 && newIndex < supportPageCount) {
      setSupportPageIndex(newIndex);
    }
  }, [supportPageCount]);

  const onSupportMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / CONTENT_WIDTH);
    if (newIndex >= 0 && newIndex < supportPageCount) {
      setSupportPageIndex(newIndex);
    }
    supportProgrammatic.current = false;
  }, [supportPageCount]);

  const scrollToPrepPage = useCallback((index: number) => {
    if (index < 0 || index >= prepPageCount) return;
    const targetOffset = index * CONTENT_WIDTH;
    prepProgrammatic.current = true;
    // 立即更新指示器
    setPrepPageIndex(index);
    prepFlatListRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
    // 等待滚动动画完成（长距离滚动需要更长时间）
    setTimeout(() => {
      prepProgrammatic.current = false;
      // 滚动结束后检查实际位置并修正指示器
      const finalOffset = (prepFlatListRef.current as any)?.scrollOffset;
      if (finalOffset !== undefined) {
        const actualIndex = Math.round(finalOffset / CONTENT_WIDTH);
        if (actualIndex !== index) {
          setPrepPageIndex(actualIndex);
        }
      }
    }, 600);
  }, [prepPageCount]);

  const scrollToSupportPage = useCallback((index: number) => {
    if (index < 0 || index >= supportPageCount) return;
    const targetOffset = index * CONTENT_WIDTH;
    supportProgrammatic.current = true;
    // 立即更新指示器
    setSupportPageIndex(index);
    supportFlatListRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
    // 等待滚动动画完成（长距离滚动需要更长时间）
    setTimeout(() => {
      supportProgrammatic.current = false;
      // 滚动结束后检查实际位置并修正指示器
      const finalOffset = (supportFlatListRef.current as any)?.scrollOffset;
      if (finalOffset !== undefined) {
        const actualIndex = Math.round(finalOffset / CONTENT_WIDTH);
        if (actualIndex !== index) {
          setSupportPageIndex(actualIndex);
        }
      }
    }, 600);
  }, [supportPageCount]);

  const periods = [state.stage];
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingItems(true);
      setLoadingSupport(true);
      try {
        const babyId = state.currentBabyId;
        const [items, support, preps] = await Promise.all([
          getPresetItemsByPeriods(periods),
          getPsychologicalSupportByPeriods(periods),
          babyId ? getUserPreparations(user.id, babyId) : Promise.resolve([]),
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
    if (!user || !state.currentBabyId) return;
    const existing = userPreparations.find(p => p.item_id === itemId);
    const newStatus = existing?.status === 'prepared' ? 'not_prepared' : 'prepared';
    try {
      const updated = await setUserPreparation(user.id, state.currentBabyId, itemId, newStatus);
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
        <View style={{ paddingTop: spacing.lg, paddingRight: spacing.lg, alignItems: 'flex-end', marginBottom: spacing.lg }}>
          <View style={{ width: '33%', minWidth: 80 }}>
            <BabySwitcher />
          </View>
        </View>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="heart-outline" size={18} color={colors.accent} />
              <Text style={styles.greeting}>
                {state.stage === 'postpartum' ? '新晋奶爸，辛苦了' : '准爸爸，你好'}
              </Text>
            </View>
          </View>
          <View style={styles.stageRow}>
            <Text style={styles.stageText}>{stageLabel}</Text>
            {state.babies.length > 0 && (
              <Text style={styles.weekText}>
                {state.stage === 'postpartum' ? state.birthAgeLabel : `第 ${state.weeksPregnant} 周`}
              </Text>
            )}
          </View>
          <Text style={styles.stageMotto}>
            {state.stage === 'preconception' && '调整身心，迎接新生命的到来'}
            {state.stage === 'first' && '孕早期要格外注意休息和营养均衡'}
            {state.stage === 'second' && '宝宝正在快速发育，保持愉悦心情'}
            {state.stage === 'third' && '胜利在望，为宝宝的到来做最后准备'}
            {state.stage === 'postpartum' && '新的人生阶段开始了，享受每一刻'}
          </Text>
        </Card>

        {/* ===== 每日小贴士 ===== */}
        <View style={styles.tipCard}>
          <View style={styles.tipBody}>
            <View style={styles.tipLabelRow}>
              <View style={styles.tipLabel}>
                <Text style={styles.tipLabelText}>今日贴士</Text>
              </View>
            </View>
            <Text style={styles.tipText}>{dailyTip}</Text>
          </View>
        </View>

        {/* ===== 宝宝大小对比 ===== */}
        {state.stage !== 'preconception' && state.stage !== 'postpartum' && state.weeksPregnant > 0 && (
          <View style={styles.bumpCard}>
            <View style={styles.bumpHeader}>
              <Text style={styles.bumpTitle}>宝宝现在多大？</Text>
            </View>
            <View style={styles.bumpBody}>
              {(() => {
                const entry = BUMP_SIZE_DATA.reduce((best, curr) =>
                  !best || Math.abs(curr.week - state.weeksPregnant) < Math.abs(best.week - state.weeksPregnant) ? curr : best
                , null as typeof BUMP_SIZE_DATA[0] | null);
                if (!entry) return null;
                return (
                  <>
                    <View style={styles.bumpEmojiCol}>
                      <Ionicons name={entry.iconName} size={40} color={colors.accent} />
                    </View>
                    <View style={styles.bumpInfo}>
                      <View style={styles.bumpFruitRow}>
                        <Text style={styles.bumpFruit}>像 {entry.fruit} 一样大</Text>
                        <Text style={styles.bumpWeek}>第 {state.weeksPregnant} 周</Text>
                      </View>
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
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        {/* 紧急关注 */}
        <View style={styles.urgentSection}>
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
                <Ionicons name="close" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          ))}
          {/* 新增按钮 */}
          <TouchableOpacity style={styles.urgentAddBtn} onPress={() => { setUrgentText(''); setShowUrgentModal(true); }}>
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={styles.urgentAddText}>新增紧急关注</Text>
          </TouchableOpacity>
        </View>

        {/* ===== 下次产检倒计时 ===== */}
        {state.stage !== 'preconception' && state.stage !== 'postpartum' && nextPrenatal && (
          <TouchableOpacity
            style={styles.checkupCard}
            onPress={() => router.push('/tasks')}
            activeOpacity={0.7}
          >
            <View style={styles.checkupHeader}>
              <Ionicons name="calendar-outline" size={14} color={colors.accent} />
              <Text style={styles.checkupHeaderTitle}>下次产检</Text>
            </View>
            <View style={styles.checkupBody}>
              <View style={styles.checkupRow}>
                <View style={styles.checkupIconWrap}>
                  <Ionicons name="document-text-outline" size={22} color={colors.accent} />
                </View>
                <View style={styles.checkupInfo}>
                  <Text style={styles.checkupLabel}>检查项目</Text>
                  <Text style={styles.checkupName}>{nextPrenatal.title}</Text>
                </View>
                <View style={[
                  styles.checkupCountdownWrap,
                  daysUntilNextPrenatal! <= 0 && styles.checkupCountdownUrgent,
                  daysUntilNextPrenatal! <= 3 && daysUntilNextPrenatal! > 0 && styles.checkupCountdownSoon,
                ]}>
                  <Text style={[
                    styles.checkupDaysNum,
                    daysUntilNextPrenatal! <= 0 && styles.checkupDaysUrgent,
                    daysUntilNextPrenatal! <= 3 && daysUntilNextPrenatal! > 0 && styles.checkupDaysSoon,
                  ]}>
                    {daysUntilNextPrenatal! <= 0 ? '今天' : `${daysUntilNextPrenatal}`}
                  </Text>
                  <Text style={[
                    styles.checkupDaysLabel,
                    daysUntilNextPrenatal! <= 0 && styles.checkupDaysLabelUrgent,
                  ]}>
                    {daysUntilNextPrenatal! <= 0 ? '检查日' : '天后'}
                  </Text>
                </View>
              </View>
              {nextPrenatal.description ? (
                <Text style={styles.checkupDesc}>{nextPrenatal.description}</Text>
              ) : null}
            </View>
            <View style={styles.checkupFooter}>
              <Text style={styles.checkupHint}>点击查看全部产检</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.muted} />
            </View>
          </TouchableOpacity>
        )}

        {/* ===== 物品准备（水平分页） ===== */}
        {presetItems.length > 0 && (
          <CollapsibleGroup title="物品准备" count={presetItems.length} defaultExpanded={false}>
            <FlatList
              ref={prepFlatListRef}
              data={prepPages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => `prep-page-${index}`}
              onScroll={onPrepScroll}
              onMomentumScrollEnd={onPrepMomentumEnd}
              scrollEventThrottle={16}
              renderItem={({ item: pageItems }) => (
                <View style={[styles.itemGrid, { width: CONTENT_WIDTH }]}>
                  {pageItems.map((item: PresetItem) => {
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
                          {isPrepared && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <View style={styles.prepInfo}>
                          <View style={styles.prepHeaderRow}>
                            <Text style={[styles.prepName, isPrepared && styles.prepNameDone]} numberOfLines={2}>{item.name}</Text>
                            <Text style={[styles.prepLevel, levelStyle]}>{levelLabel}</Text>
                          </View>
                          {item.description && (
                            <Text style={[styles.prepDesc, isPrepared && styles.prepDescDone]} numberOfLines={1}>
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
                </View>
              )}
            />
            {/* 分页指示器 */}
            {prepPageCount > 1 && (
              <View style={styles.dotsContainer}>
                <TouchableOpacity
                  style={[styles.pageBtn, prepPageIndex === 0 && styles.pageBtnDisabled]}
                  onPress={() => scrollToPrepPage(prepPageIndex - 1)}
                  disabled={prepPageIndex === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={prepPageIndex === 0 ? colors.muted : colors.accent} />
                </TouchableOpacity>

                {Array.from({ length: prepPageCount }).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dot, index === prepPageIndex && styles.dotActive]}
                    onPress={() => scrollToPrepPage(index)}
                    activeOpacity={0.7}
                  />
                ))}

                <TouchableOpacity
                  style={[styles.pageBtn, prepPageIndex >= prepPageCount - 1 && styles.pageBtnDisabled]}
                  onPress={() => scrollToPrepPage(prepPageIndex + 1)}
                  disabled={prepPageIndex >= prepPageCount - 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={16} color={prepPageIndex >= prepPageCount - 1 ? colors.muted : colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </CollapsibleGroup>
        )}

        {/* ===== 心理支持（水平分页） ===== */}
        {supportTips.length > 0 && (
          <CollapsibleGroup title="心理支持" count={supportTips.length} defaultExpanded={false}>
            <FlatList
              ref={supportFlatListRef}
              data={supportPages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => `support-page-${index}`}
              onScroll={onSupportScroll}
              onMomentumScrollEnd={onSupportMomentumEnd}
              scrollEventThrottle={16}
              renderItem={({ item: pageItems }) => (
                <View style={[styles.itemGrid, { width: CONTENT_WIDTH }]}>
                  {pageItems.map((tip: PsychologicalSupport) => {
                    const typeLabel = tip.support_type === 'emotion' ? '情绪' : tip.support_type === 'communication' ? '沟通' : tip.support_type === 'action' ? '行动' : '知识';
                    const badgeStyle = tip.support_type === 'emotion' ? styles.supportTypeEmotion
                      : tip.support_type === 'communication' ? styles.supportTypeCommunication
                      : tip.support_type === 'action' ? styles.supportTypeAction
                      : styles.supportTypeKnowledge;

                    return (
                      <TouchableOpacity key={tip.id} style={styles.supportCard} onPress={() => setSelectedTip(tip)} activeOpacity={0.7}>
                        <View style={styles.supportHeader}>
                          <Text style={styles.supportTitle} numberOfLines={2}>{tip.title}</Text>
                          <Text style={[styles.supportTypeBadge, badgeStyle]}>{typeLabel}</Text>
                        </View>
                        <Text style={[styles.supportContent, { fontSize: 12, lineHeight: 18 }]} numberOfLines={2}>{tip.content}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
            {/* 分页指示器 */}
            {supportPageCount > 1 && (
              <View style={styles.dotsContainer}>
                <TouchableOpacity
                  style={[styles.pageBtn, supportPageIndex === 0 && styles.pageBtnDisabled]}
                  onPress={() => scrollToSupportPage(supportPageIndex - 1)}
                  disabled={supportPageIndex === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={supportPageIndex === 0 ? colors.muted : colors.accent} />
                </TouchableOpacity>

                {Array.from({ length: supportPageCount }).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dot, index === supportPageIndex && styles.dotActive]}
                    onPress={() => scrollToSupportPage(index)}
                    activeOpacity={0.7}
                  />
                ))}

                <TouchableOpacity
                  style={[styles.pageBtn, supportPageIndex >= supportPageCount - 1 && styles.pageBtnDisabled]}
                  onPress={() => scrollToSupportPage(supportPageIndex + 1)}
                  disabled={supportPageIndex >= supportPageCount - 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={16} color={supportPageIndex >= supportPageCount - 1 ? colors.muted : colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </CollapsibleGroup>
        )}

        {/* ===== AI 助手入口 ===== */}
        <TouchableOpacity
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.lg,
            backgroundColor: colors.accent,
            borderRadius: radius.md,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
          onPress={() => router.push('/ai')}
          activeOpacity={0.75}
        >
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.headline, color: '#fff' }}>AI 问答助手</Text>
            <Text style={{ ...typography.footnote, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              关于孕期育儿的任何问题，AI 随时回答
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* ===== 工具箱九宫格 ===== */}
        <View>
          <ToolGrid
            tools={activeTools}
            currentStage={state.stage}
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

      {/* 心理支持详情弹窗 */}
      <Modal visible={!!selectedTip} animationType="fade" transparent onRequestClose={() => setSelectedTip(null)}>
        <Pressable style={styles.urgentModalOverlay} onPress={() => setSelectedTip(null)}>
          <Pressable style={styles.urgentModalContent} onPress={e => e.stopPropagation()}>
            {selectedTip && (() => {
              const typeLabel = selectedTip.support_type === 'emotion' ? '情绪' : selectedTip.support_type === 'communication' ? '沟通' : selectedTip.support_type === 'action' ? '行动' : '知识';
              const badgeStyle = selectedTip.support_type === 'emotion' ? styles.supportTypeEmotion
                : selectedTip.support_type === 'communication' ? styles.supportTypeCommunication
                : selectedTip.support_type === 'action' ? styles.supportTypeAction
                : styles.supportTypeKnowledge;
              return (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <Text style={styles.urgentModalTitle}>{selectedTip.title}</Text>
                    <Text style={[styles.supportTypeBadge, badgeStyle]}>{typeLabel}</Text>
                  </View>
                  <View style={{ borderLeftWidth: 2, borderLeftColor: colors.accentLight, paddingLeft: spacing.md, marginBottom: spacing.md }}>
                    <Text style={styles.supportContent}>{selectedTip.content}</Text>
                  </View>
                  {selectedTip.tips && selectedTip.tips.length > 0 && (
                    <View style={styles.supportTips}>
                      <Text style={{ ...typography.callout, fontWeight: '600', marginBottom: spacing.sm }}>具体建议：</Text>
                      {selectedTip.tips.map((t, i) => (
                        <View key={i} style={styles.supportTipRow}>
                          <Text style={styles.supportTipIndex}>{String(i + 1).padStart(2, '0')}</Text>
                          <Text style={styles.supportTipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity style={styles.urgentModalSave} onPress={() => setSelectedTip(null)}>
                    <Text style={styles.urgentModalSaveText}>关闭</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
