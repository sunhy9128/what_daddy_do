import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput, Pressable, Animated, useWindowDimensions, PixelRatio } from 'react-native';
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
import { SwipeActions } from '../../src/components/molecules';

import { useColors, useTheme } from '../../src/context/ThemeContext';
import { spacing, typography, radius, shadows, MAX_FONT_SCALE } from '../../src/styles/tokens';

import { STAGES } from '../../src/lib/stages';
import { BUMP_SIZE_DATA } from '../../src/lib/bump-size-data';
import { formatRelativeTime } from '../../src/lib/time';


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

const DECK_CARD_WIDTH = 250;
const DECK_CARD_HEIGHT = 340;
const DECK_MAX_VISIBLE = 3;
// 堆叠层级的位姿，与 depthAnim 的插值 outputRange 保持一致
const DECK_DEPTH_TRANSLATE_Y = [0, 10, 19] as const;
const DECK_DEPTH_SCALE = [1, 0.96, 0.92] as const;

type UrgentDeckNote = { id: string; content: string; createdAt: string };
type ThemeColors = ReturnType<typeof useColors>;

function UrgentDeckCard({
  note,
  depth,
  isFront,
  exiting,
  exitAnim,
  onAdvance,
  onDismiss,
  colors,
  flat = false,
  flatWidth,
  flatHeight,
}: {
  note: UrgentDeckNote;
  depth: number;
  isFront: boolean;
  exiting: boolean;
  exitAnim: Animated.Value;
  onAdvance: () => void;
  onDismiss: () => void;
  colors: ThemeColors;
  /** 平铺模式：静态整卡，不做堆叠与飞出 */
  flat?: boolean;
  flatWidth?: number;
  flatHeight?: number;
}) {
  const depthAnim = useRef(new Animated.Value(depth)).current;
  const prevDepth = useRef(depth);
  // 顶牌飞出后被回收为后排的当帧，depthAnim 还是 0（整卡尺寸），
  // 直接按目标位姿渲染，避免回收卡在新顶牌四周先露出一圈。
  const recycledToBack = prevDepth.current === 0 && depth > 0;

  useLayoutEffect(() => {
    const from = prevDepth.current;
    prevDepth.current = depth;
    // 连续快翻时先停掉上一段弹簧，避免两个动画抢同一个值
    depthAnim.stopAnimation();
    // 顶牌飞出后回到底层：直接落位，避免回收瞬间比新顶牌还宽
    if (from === 0 && depth > 0) {
      depthAnim.setValue(depth);
      return;
    }
    Animated.spring(depthAnim, {
      toValue: depth,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [depth, depthAnim]);

  const styles = useMemo(() => StyleSheet.create({
    slot: {
      position: 'absolute',
      top: 0,
      left: '50%',
      marginLeft: -DECK_CARD_WIDTH / 2,
      width: DECK_CARD_WIDTH,
      height: DECK_CARD_HEIGHT,
    },
    slotFlat: {
      width: flatWidth ?? DECK_CARD_WIDTH,
      height: flatHeight ?? DECK_CARD_HEIGHT,
    },
    pressArea: {
      flex: 1,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: colors.border,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: 64,
      overflow: 'hidden',
      ...shadows.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      ...typography.caption2,
      fontWeight: '600',
      color: colors.error,
      letterSpacing: 0.5,
    },
    time: {
      ...typography.caption2,
      color: colors.muted,
      letterSpacing: 0.3,
      fontVariant: ['tabular-nums'],
    },
    contentWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    text: {
      ...typography.title3,
      fontWeight: '600',
      color: colors.fg,
      lineHeight: 27,
    },
    dismissWrap: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
    },
    dismiss: {
      borderRadius: radius.full,
      borderWidth: 0.5,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSurface,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
    },
    dismissText: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.error,
    },
  }), [colors, flatWidth, flatHeight]);

  const depthTier = Math.min(depth, DECK_MAX_VISIBLE - 1);
  const translateY = recycledToBack
    ? DECK_DEPTH_TRANSLATE_Y[depthTier]
    : depthAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 10, 19] });
  const scale = recycledToBack
    ? DECK_DEPTH_SCALE[depthTier]
    : depthAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0.96, 0.92] });

  return (
    <Animated.View
      style={flat ? styles.slotFlat : [styles.slot, { zIndex: DECK_MAX_VISIBLE - depth, transform: [{ translateY }, { scale }] }]}
    >
      <Animated.View
        style={[
          styles.pressArea,
          !flat && isFront && exiting && {
            opacity: exitAnim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) },
              { rotate: exitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '7deg'] }) },
            ],
          },
        ]}
      >
        <Pressable
          style={styles.card}
          onPress={flat ? undefined : onAdvance}
          disabled={!flat && !isFront}
          accessibilityRole={flat ? undefined : 'button'}
          accessibilityLabel={`紧急关注：${note.content}`}
          accessibilityHint={!flat && isFront ? '轻点切换下一条' : undefined}
        >
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <Ionicons name="alert-circle-outline" size={12} color={colors.error} allowFontScaling={false} />
              <Text style={styles.badgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>紧急关注</Text>
            </View>
            <Text style={styles.time} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatRelativeTime(note.createdAt)}</Text>
          </View>
          <View style={styles.contentWrap}>
            <Text style={styles.text} numberOfLines={flat ? 2 : 4} maxFontSizeMultiplier={MAX_FONT_SCALE}>{note.content}</Text>
          </View>
        </Pressable>
        {(flat || isFront) && (
          <View style={styles.dismissWrap} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.dismiss}
              onPress={onDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="知道了，关闭此关注"
            >
              <Text style={styles.dismissText} maxFontSizeMultiplier={MAX_FONT_SCALE}>知道了</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

function PrepDeckCard({
  item,
  isPrepared,
  depth,
  isFront,
  canAdvance,
  exiting,
  exitAnim,
  onAdvance,
  onToggle,
  onRemove,
  colors,
  flat = false,
  flatWidth,
  flatHeight,
}: {
  item: PresetItem;
  isPrepared: boolean;
  depth: number;
  isFront: boolean;
  canAdvance: boolean;
  exiting: boolean;
  exitAnim: Animated.Value;
  onAdvance: () => void;
  onToggle: () => void;
  onRemove: () => void;
  colors: ThemeColors;
  /** 平铺模式：静态整卡，不做堆叠与飞出 */
  flat?: boolean;
  flatWidth?: number;
  flatHeight?: number;
}) {
  const depthAnim = useRef(new Animated.Value(depth)).current;
  const prevDepth = useRef(depth);
  // 顶牌飞出后被回收为后排的当帧，depthAnim 还是 0（整卡尺寸），
  // 直接按目标位姿渲染，避免回收卡在新顶牌四周先露出一圈。
  const recycledToBack = prevDepth.current === 0 && depth > 0;

  useLayoutEffect(() => {
    const from = prevDepth.current;
    prevDepth.current = depth;
    // 连续快翻时先停掉上一段弹簧，避免两个动画抢同一个值
    depthAnim.stopAnimation();
    // 顶牌飞出后回到底层：直接落位，避免回收瞬间比新顶牌还宽
    if (from === 0 && depth > 0) {
      depthAnim.setValue(depth);
      return;
    }
    Animated.spring(depthAnim, {
      toValue: depth,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [depth, depthAnim]);

  const level = item.essential_level;
  const levelLabel = level === 'essential' ? '必需' : level === 'recommended' ? '推荐' : '可选';

  const styles = useMemo(() => StyleSheet.create({
    slot: {
      position: 'absolute',
      top: 0,
      left: '50%',
      marginLeft: -DECK_CARD_WIDTH / 2,
      width: DECK_CARD_WIDTH,
      height: DECK_CARD_HEIGHT,
    },
    pressArea: {
      flex: 1,
    },
    slotFlat: {
      width: flatWidth ?? DECK_CARD_WIDTH,
      height: flatHeight ?? DECK_CARD_HEIGHT,
    },
    swipeWrap: {
      flex: 1,
      borderRadius: radius.md,
      borderColor: isPrepared ? colors.accent + '66' : colors.border,
      ...shadows.md,
    },
    swipeContent: {
      flex: 1,
    },
    card: {
      flex: 1,
      backgroundColor: isPrepared ? colors.surfaceSecondary : colors.surface,
      padding: spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      ...typography.caption2,
      fontWeight: '600',
      color: colors.fgSecondary,
      letterSpacing: 0.5,
    },
    level: {
      ...typography.caption2,
      fontWeight: '600',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      overflow: 'hidden',
      letterSpacing: 0.3,
    },
    levelEssential: { color: '#fff', backgroundColor: colors.accent },
    levelRecommended: { color: colors.accent, backgroundColor: colors.accentLight },
    levelOptional: { color: colors.muted, backgroundColor: 'transparent' },
    contentWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      ...typography.title3,
      fontWeight: '600',
      color: colors.fg,
      lineHeight: 27,
    },
    nameDone: {
      color: colors.muted,
      textDecorationLine: 'line-through',
    },
    desc: {
      ...typography.footnote,
      color: colors.fgSecondary,
      lineHeight: 19,
      marginTop: spacing.sm,
    },
    descDone: { color: colors.muted },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    metaCategory: {
      ...typography.caption2,
      color: colors.muted,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    metaQty: {
      ...typography.caption2,
      color: colors.fgSecondary,
      fontWeight: '500',
      fontVariant: ['tabular-nums'],
    },
  }), [colors, isPrepared, flatWidth, flatHeight]);

  const depthTier = Math.min(depth, DECK_MAX_VISIBLE - 1);
  const translateY = recycledToBack
    ? DECK_DEPTH_TRANSLATE_Y[depthTier]
    : depthAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 10, 19] });
  const scale = recycledToBack
    ? DECK_DEPTH_SCALE[depthTier]
    : depthAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0.96, 0.92] });

  return (
    <Animated.View
      style={flat ? styles.slotFlat : [styles.slot, { zIndex: DECK_MAX_VISIBLE - depth, transform: [{ translateY }, { scale }] }]}
      pointerEvents={flat || isFront ? 'auto' : 'none'}
    >
      <Animated.View
        style={[
          styles.pressArea,
          !flat && isFront && exiting && {
            opacity: exitAnim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) },
              { rotate: exitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '7deg'] }) },
            ],
          },
        ]}
      >
        <SwipeActions
          wrapStyle={styles.swipeWrap}
          contentStyle={styles.swipeContent}
          onSwipeLeft={onToggle}
          onSwipeRight={onRemove}
          leftLabel="删除"
          rightLabel={isPrepared ? '未完成' : '完成'}
          rightColor={isPrepared ? colors.muted : colors.accent}
        >
          <Pressable
            style={styles.card}
            onPress={flat ? onToggle : onAdvance}
            disabled={!flat && !isFront}
            accessibilityRole="button"
            accessibilityLabel={`物品准备：${item.name}${isPrepared ? '，已完成' : ''}`}
            accessibilityHint={flat ? '点击切换完成状态，左滑标记完成，右滑删除' : isFront && canAdvance ? '轻点切换下一件，左滑标记完成，右滑删除' : undefined}
          >
            <View style={styles.topRow}>
              <View style={styles.badge}>
                <Ionicons name="bag-handle-outline" size={12} color={colors.fgSecondary} allowFontScaling={false} />
                <Text style={styles.badgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>物品准备</Text>
              </View>
              <Text style={[styles.level, level === 'essential' ? styles.levelEssential : level === 'recommended' ? styles.levelRecommended : styles.levelOptional]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {levelLabel}
              </Text>
            </View>
            <View style={styles.contentWrap}>
              <Text style={[styles.name, isPrepared && styles.nameDone]} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.name}</Text>
              {item.description ? (
                <Text style={[styles.desc, isPrepared && styles.descDone]} numberOfLines={flat ? 2 : 4} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.description}</Text>
              ) : null}
              <View style={styles.meta}>
                <Text style={styles.metaCategory} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.category}</Text>
                {item.quantity_suggestion ? (
                  <Text style={styles.metaQty} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.quantity_suggestion}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        </SwipeActions>
      </Animated.View>
    </Animated.View>
  );
}

function SupportDeckCard({
  tip,
  depth,
  isFront,
  canAdvance,
  exiting,
  exitAnim,
  onAdvance,
  onOpenDetail,
  colors,
  flat = false,
  flatWidth,
  flatHeight,
}: {
  tip: PsychologicalSupport;
  depth: number;
  isFront: boolean;
  canAdvance: boolean;
  exiting: boolean;
  exitAnim: Animated.Value;
  onAdvance: () => void;
  onOpenDetail: () => void;
  colors: ThemeColors;
  /** 平铺模式：静态整卡，不做堆叠与飞出 */
  flat?: boolean;
  flatWidth?: number;
  flatHeight?: number;
}) {
  const depthAnim = useRef(new Animated.Value(depth)).current;
  const prevDepth = useRef(depth);
  // 顶牌飞出后被回收为后排的当帧，depthAnim 还是 0（整卡尺寸），
  // 直接按目标位姿渲染，避免回收卡在新顶牌四周先露出一圈。
  const recycledToBack = prevDepth.current === 0 && depth > 0;

  useLayoutEffect(() => {
    const from = prevDepth.current;
    prevDepth.current = depth;
    // 连续快翻时先停掉上一段弹簧，避免两个动画抢同一个值
    depthAnim.stopAnimation();
    // 顶牌飞出后回到底层：直接落位，避免回收瞬间比新顶牌还宽
    if (from === 0 && depth > 0) {
      depthAnim.setValue(depth);
      return;
    }
    Animated.spring(depthAnim, {
      toValue: depth,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [depth, depthAnim]);

  const typeLabel = tip.support_type === 'emotion' ? '情绪' : tip.support_type === 'communication' ? '沟通' : tip.support_type === 'action' ? '行动' : '知识';

  const styles = useMemo(() => StyleSheet.create({
    slot: {
      position: 'absolute',
      top: 0,
      left: '50%',
      marginLeft: -DECK_CARD_WIDTH / 2,
      width: DECK_CARD_WIDTH,
      height: DECK_CARD_HEIGHT,
    },
    pressArea: {
      flex: 1,
    },
    slotFlat: {
      width: flatWidth ?? DECK_CARD_WIDTH,
      height: flatHeight ?? DECK_CARD_HEIGHT,
    },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: colors.border,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: 64,
      ...shadows.md,
    },
    cardFlat: {
      paddingBottom: 56,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    badgeText: {
      ...typography.caption2,
      fontWeight: '600',
      color: colors.fgSecondary,
      letterSpacing: 0.5,
    },
    typeBadge: {
      ...typography.caption2,
      fontWeight: '600',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      overflow: 'hidden',
      letterSpacing: 0.3,
    },
    typeEmotion: { color: '#fff', backgroundColor: colors.accent },
    typeCommunication: { color: colors.accent, backgroundColor: colors.accentLight, borderWidth: 0.5, borderColor: colors.accent + '40' },
    typeAction: { color: '#fff', backgroundColor: colors.warning },
    typeKnowledge: { color: colors.muted, backgroundColor: 'transparent', borderWidth: 0.5, borderColor: colors.border },
    contentWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      ...typography.title3,
      fontWeight: '600',
      color: colors.fg,
      lineHeight: 27,
    },
    content: {
      ...typography.subhead,
      color: colors.fgSecondary,
      lineHeight: 22,
      marginTop: spacing.sm,
    },
    pillWrap: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: radius.full,
      borderWidth: 0.5,
      borderColor: colors.accent + '55',
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
    },
    pillText: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.accent,
    },
  }), [colors, flatWidth, flatHeight]);

  const depthTier = Math.min(depth, DECK_MAX_VISIBLE - 1);
  const translateY = recycledToBack
    ? DECK_DEPTH_TRANSLATE_Y[depthTier]
    : depthAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 10, 19] });
  const scale = recycledToBack
    ? DECK_DEPTH_SCALE[depthTier]
    : depthAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0.96, 0.92] });

  return (
    <Animated.View
      style={flat ? styles.slotFlat : [styles.slot, { zIndex: DECK_MAX_VISIBLE - depth, transform: [{ translateY }, { scale }] }]}
      pointerEvents={flat || isFront ? 'auto' : 'none'}
    >
      <Animated.View
        style={[
          styles.pressArea,
          !flat && isFront && exiting && {
            opacity: exitAnim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) },
              { rotate: exitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '7deg'] }) },
            ],
          },
        ]}
      >
        <Pressable
          style={[styles.card, flat && styles.cardFlat]}
          onPress={flat ? onOpenDetail : onAdvance}
          disabled={!flat && !isFront}
          accessibilityRole="button"
          accessibilityLabel={`心理支持：${tip.title}`}
          accessibilityHint={flat ? '点击查看详情' : isFront ? (canAdvance ? '轻点切换下一条，点击查看详情' : '点击查看详情') : undefined}
        >
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <Ionicons name="heart-outline" size={12} color={colors.fgSecondary} allowFontScaling={false} />
              <Text style={styles.badgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>心理支持</Text>
            </View>
            <Text style={[styles.typeBadge, tip.support_type === 'emotion' ? styles.typeEmotion : tip.support_type === 'communication' ? styles.typeCommunication : tip.support_type === 'action' ? styles.typeAction : styles.typeKnowledge]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {typeLabel}
            </Text>
          </View>
          <View style={styles.contentWrap}>
            <Text style={styles.title} numberOfLines={flat ? 2 : 3} maxFontSizeMultiplier={MAX_FONT_SCALE}>{tip.title}</Text>
            <Text style={styles.content} numberOfLines={flat ? 3 : 6} maxFontSizeMultiplier={MAX_FONT_SCALE}>{tip.content}</Text>
          </View>
        </Pressable>
        {(flat || isFront) && (
          <View style={styles.pillWrap} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.pill}
              onPress={onOpenDetail}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`查看${tip.title}的详情`}
            >
              <Ionicons name="document-text-outline" size={13} color={colors.accent} allowFontScaling={false} />
              <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_SCALE}>查看详情</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const deckToggleStyles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(250, 248, 243, 0.38)',
    backgroundColor: 'rgba(250, 248, 243, 0.12)',
  },
  text: {
    ...typography.caption1,
    fontWeight: '600',
    color: 'rgba(250, 248, 243, 0.9)',
    letterSpacing: 0.3,
  },
});

function DeckToggleButton({ expanded, onPress }: { expanded: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={deckToggleStyles.toggle}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={expanded ? '收起堆叠' : '展开平铺'}
    >
      <Ionicons
        name={expanded ? 'albums-outline' : 'expand-outline'}
        size={14}
        color="rgba(250, 248, 243, 0.9)"
      />
      <Text style={deckToggleStyles.text}>{expanded ? '收起堆叠' : '展开平铺'}</Text>
    </TouchableOpacity>
  );
}

const flatPagerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  btn: { padding: spacing.xs },
  btnDisabled: { opacity: 0.6 },
  text: {
    ...typography.caption1,
    color: 'rgba(250, 248, 243, 0.85)',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
});

function FlatPager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <View style={flatPagerStyles.row}>
      <TouchableOpacity
        style={[flatPagerStyles.btn, page === 0 && flatPagerStyles.btnDisabled]}
        onPress={() => onChange(page - 1)}
        disabled={page === 0}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="上一页"
      >
        <Ionicons name="chevron-back" size={16} color={page === 0 ? 'rgba(250, 248, 243, 0.3)' : 'rgba(250, 248, 243, 0.9)'} />
      </TouchableOpacity>
      <Text style={flatPagerStyles.text}>{page + 1} / {pageCount}</Text>
      <TouchableOpacity
        style={[flatPagerStyles.btn, page >= pageCount - 1 && flatPagerStyles.btnDisabled]}
        onPress={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="下一页"
      >
        <Ionicons name="chevron-forward" size={16} color={page >= pageCount - 1 ? 'rgba(250, 248, 243, 0.3)' : 'rgba(250, 248, 243, 0.9)'} />
      </TouchableOpacity>
    </View>
  );
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
  const [showUrgentPanel, setShowUrgentPanel] = useState(false);
  const [showPrepPanel, setShowPrepPanel] = useState(false);
  const [showSupportPanel, setShowSupportPanel] = useState(false);
  const [urgentText, setUrgentText] = useState('');
  const [urgentLoading, setUrgentLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<{ instanceId: string; toolId: string }[]>([]);

  // 悬浮闹铃：有紧急关注时周期性抖动，数量为 0 时静止归位
  const bellRotate = useRef(new Animated.Value(0)).current;
  const hasUrgentNotes = state.urgentNotes.length > 0;
  useEffect(() => {
    if (!hasUrgentNotes) {
      bellRotate.setValue(0);
      return;
    }
    const shake = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(bellRotate, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: -0.8, duration: 90, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 0.6, duration: 90, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: -0.35, duration: 90, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 0.15, duration: 90, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 0, duration: 90, useNativeDriver: true }),
      ]),
    );
    shake.start();
    return () => shake.stop();
  }, [bellRotate, hasUrgentNotes]);
  const bellRotation = bellRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] });

  // 弹窗浮动出现
  const urgentModalAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!showUrgentModal) return;
    urgentModalAnim.setValue(0);
    Animated.spring(urgentModalAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
  }, [showUrgentModal, urgentModalAnim]);

  // 紧急关注面板：浮动出现
  const urgentPanelAnim = useRef(new Animated.Value(1)).current;
  // 牌堆：当前置顶卡索引导与切牌动画进度
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckExiting, setDeckExiting] = useState(false);
  const deckExit = useRef(new Animated.Value(0)).current;
  // 展开平铺（分页）
  const [urgentFlat, setUrgentFlat] = useState(false);
  const [urgentPage, setUrgentPage] = useState(0);
  const urgentModeAnim = useRef(new Animated.Value(1)).current;
  // 平铺面板宽度 = min(视口 - 浮层左右留白, 800)
  const { width: windowW, height: windowH } = useWindowDimensions();
  const flatRowW = Math.min(windowW - spacing.xl * 2, 800);
  // 平铺默认两行两列：卡片宽度随面板收缩保证两列放得下；再窄就单列，避免卡头被挤到溢出
  const flatCols = flatRowW >= 312 ? 2 : 1;
  const flatCardW = flatCols === 2 ? Math.min(DECK_CARD_WIDTH, Math.floor((flatRowW - spacing.md) / 2)) : Math.min(DECK_CARD_WIDTH, flatRowW);
  // 系统字体缩放封顶；等效宽度用于判断放大后是否还排得下并排入口
  const cappedFontScale = Math.max(1, Math.min(PixelRatio.getFontScale(), MAX_FONT_SCALE));
  const effectiveW = windowW / cappedFontScale;
  // 两列窄卡放不下按 250x340 等比缩小的文字（标题 2 行 + 正文 3 行 + 查看详情按钮），
  // 给平铺卡一个随字体缩放的最小高度，避免文字溢出卡片
  const FLAT_MIN_CARD_H = 232;
  // 卡片高度随系统字体缩放（封顶 MAX_FONT_SCALE）一起放大，否则固定高度会把放大后的文字裁掉
  const flatCardH = Math.min(
    Math.max(
      Math.round(((flatCardW * DECK_CARD_HEIGHT) / DECK_CARD_WIDTH) * cappedFontScale),
      Math.round(FLAT_MIN_CARD_H * cappedFontScale),
    ),
    DECK_CARD_HEIGHT,
  );
  const flatPerPage = flatCols * 2;
  // 浮层不允许超出屏幕：超出部分交给内部 ScrollView，避免小屏/大字体下顶部与底部被裁掉
  const flatPanelMaxH = Math.max(260, windowH - insets.top - insets.bottom - 48);

  const urgentDeckNotes = useMemo(() => {
    const total = state.urgentNotes.length;
    if (total === 0) return [];
    return Array.from(
      { length: Math.min(DECK_MAX_VISIBLE, total) },
      (_, i) => state.urgentNotes[(deckIndex + i) % total],
    );
  }, [state.urgentNotes, deckIndex]);

  const urgentPageCount = Math.max(1, Math.ceil(state.urgentNotes.length / flatPerPage));
  const urgentSafePage = Math.min(urgentPage, urgentPageCount - 1);
  const urgentPageNotes = useMemo(
    () => state.urgentNotes.slice(urgentSafePage * flatPerPage, (urgentSafePage + 1) * flatPerPage),
    [state.urgentNotes, urgentSafePage, flatPerPage],
  );

  const toggleUrgentMode = () => {
    urgentModeAnim.setValue(0);
    Animated.spring(urgentModeAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
    if (urgentFlat) {
      setDeckIndex(urgentSafePage * flatPerPage);
      setUrgentFlat(false);
    } else {
      setUrgentPage(Math.floor(deckIndex / flatPerPage));
      setUrgentFlat(true);
    }
  };

  useEffect(() => {
    if (!showUrgentPanel) return;
    // 每次打开都从最新一条开始
    setDeckIndex(0);
    setDeckExiting(false);
    deckExit.setValue(0);
    setUrgentFlat(false);
    setUrgentPage(0);
    urgentPanelAnim.setValue(0);
    Animated.spring(urgentPanelAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
  }, [showUrgentPanel, urgentPanelAnim, deckExit]);

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

  const bumpEntry = useMemo(() => {
    if (state.stage === 'preconception' || state.stage === 'postpartum' || !(state.weeksPregnant > 0)) return null;
    return BUMP_SIZE_DATA.reduce((best, curr) =>
      !best || Math.abs(curr.week - state.weeksPregnant) < Math.abs(best.week - state.weeksPregnant) ? curr : best
    , null as typeof BUMP_SIZE_DATA[0] | null);
  }, [state.stage, state.weeksPregnant]);

  const styles = useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  notLoggedIn: { ...typography.callout, color: colors.fgSecondary },
  loginLink: { ...typography.callout, color: colors.accent, fontWeight: '600' },

  // Header
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  greeting: { ...typography.footnote, color: colors.muted, marginBottom: spacing.xs },
  stageText: { ...typography.title3, fontWeight: '700', color: colors.fg },
  stageRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.sm },
  weekText: { ...typography.subhead, color: colors.accent, fontWeight: '500' },
  stageMotto: {
    ...typography.footnote,
    color: colors.fgSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  // 每日小贴士
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBody: {
    flex: 1,
  },
  tipLabelText: {
    ...typography.caption2,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  tipText: {
    ...typography.callout,
    color: colors.fg,
    lineHeight: 23,
  },

  // 紧急关注（铃铛浮层：前后叠放的牌堆）
  urgentStackWrap: {
    width: '100%',
    maxWidth: 400,
  },
  deckContainer: {
    height: DECK_CARD_HEIGHT + 24,
    marginTop: spacing.md,
  },
  deckHint: {
    ...typography.caption1,
    color: 'rgba(250, 248, 243, 0.85)',
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.3,
  },
  deckSubHint: {
    ...typography.caption2,
    color: 'rgba(250, 248, 243, 0.55)',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // 展开平铺（整卡并排分页）：外层 Pressable 收缩包裹，maxWidth 撑不开，需显式宽度；
  // 同时覆盖 urgentStackWrap 的 maxWidth: 400，否则会被钳回 400
  flatStackWrap: {
    width: flatRowW,
    maxWidth: flatRowW,
  },
  flatRowWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  flatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    // 两列时锁定行宽，防止宽面板下挤进第三列；末行不满时靠左，网格块整体仍由 flatRowWrap 居中
    maxWidth: flatCols === 2 ? flatCardW * 2 + spacing.md : undefined,
  },
  urgentEmptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  urgentEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  urgentEmptyText: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fgSecondary,
    marginBottom: spacing.xs,
  },
  urgentEmptyHint: {
    ...typography.caption1,
    color: colors.muted,
    textAlign: 'center',
  },
  urgentAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.dangerBorder,
    ...shadows.sm,
  },
  urgentAddPillText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.error,
  },
  urgentFab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
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

  // ===== 首页顶部并排卡片（孕期 / 宝宝大小） =====
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  bellBadgeText: {
    ...typography.caption2,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: '#fff',
  },
  topCardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  // 极窄屏（<360dp，或系统显示大小放大后等效宽度）并排会裁掉内容，改为上下堆叠
  topCardsRowStacked: {
    flexDirection: 'column',
  },
  topCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  topCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  topCardIconCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardInfo: {
    flex: 1,
  },
  bumpWeekSm: {
    ...typography.subhead,
    color: colors.fgSecondary,
    marginTop: 2,
  },
  bumpFruit: {
    ...typography.title3,
    fontWeight: '700',
    color: colors.fg,
  },
  bumpMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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

  // ===== 物品准备 / 心理支持入口按钮 =====
  sectionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionRowStacked: {
    flexDirection: 'column',
  },
  sectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  sectionBtnTitle: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
    flex: 1,
  },
  sectionBtnBadge: {
    minWidth: 20,
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  sectionBtnBadgeText: {
    ...typography.caption2,
    fontWeight: '600',
    color: '#fff',
  },

  // ===== 心理支持详情样式 =====
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

}), [colors, isDark, flatRowW]);

  // 物品准备 + 心理支持
  const [presetItems, setPresetItems] = useState<PresetItem[]>([]);
  const [userPreparations, setUserPreparations] = useState<UserPreparation[]>([]);
  const [supportTips, setSupportTips] = useState<PsychologicalSupport[]>([]);

  // 物品准备牌堆：当前置顶卡索引与切牌动画进度
  const [prepDeckIndex, setPrepDeckIndex] = useState(0);
  const [prepDeckExiting, setPrepDeckExiting] = useState(false);
  const prepDeckExit = useRef(new Animated.Value(0)).current;

  // 心理支持牌堆
  const [supportDeckIndex, setSupportDeckIndex] = useState(0);
  const [supportDeckExiting, setSupportDeckExiting] = useState(false);
  const supportDeckExit = useRef(new Animated.Value(0)).current;

  // 展开平铺（分页）
  const [prepFlat, setPrepFlat] = useState(false);
  const [prepPage, setPrepPage] = useState(0);
  const [supportFlat, setSupportFlat] = useState(false);
  const [supportPage, setSupportPage] = useState(0);
  const prepModeAnim = useRef(new Animated.Value(1)).current;
  const supportModeAnim = useRef(new Animated.Value(1)).current;

  // 浮层面板弹出动画
  const prepPanelAnim = useRef(new Animated.Value(1)).current;
  const supportPanelAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!showPrepPanel) return;
    prepPanelAnim.setValue(0);
    Animated.spring(prepPanelAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
  }, [showPrepPanel, prepPanelAnim]);
  useEffect(() => {
    if (!showSupportPanel) return;
    supportPanelAnim.setValue(0);
    Animated.spring(supportPanelAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
  }, [showSupportPanel, supportPanelAnim]);

  // 心理支持详情（在支持浮层内切换）
  const [selectedTip, setSelectedTip] = useState<PsychologicalSupport | null>(null);

  // 可见物品：右滑「删除」= 标记 not_needed，从牌堆中隐藏
  const visiblePresetItems = useMemo(() => {
    const hidden = new Set(
      userPreparations.filter(p => p.status === 'not_needed').map(p => p.item_id),
    );
    return presetItems.filter(item => !hidden.has(item.id));
  }, [presetItems, userPreparations]);

  const supportDeckItems = useMemo(() => {
    const total = supportTips.length;
    if (total === 0) return [];
    return Array.from(
      { length: Math.min(DECK_MAX_VISIBLE, total) },
      (_, i) => supportTips[(supportDeckIndex + i) % total],
    );
  }, [supportTips, supportDeckIndex]);

  const prepDeckItems = useMemo(() => {
    const total = visiblePresetItems.length;
    if (total === 0) return [];
    return Array.from(
      { length: Math.min(DECK_MAX_VISIBLE, total) },
      (_, i) => visiblePresetItems[(prepDeckIndex + i) % total],
    );
  }, [visiblePresetItems, prepDeckIndex]);

  const prepPageCount = Math.max(1, Math.ceil(visiblePresetItems.length / flatPerPage));
  const prepSafePage = Math.min(prepPage, prepPageCount - 1);
  const prepPageItems = useMemo(
    () => visiblePresetItems.slice(prepSafePage * flatPerPage, (prepSafePage + 1) * flatPerPage),
    [visiblePresetItems, prepSafePage, flatPerPage],
  );

  const supportPageCount = Math.max(1, Math.ceil(supportTips.length / flatPerPage));
  const supportSafePage = Math.min(supportPage, supportPageCount - 1);
  const supportPageItems = useMemo(
    () => supportTips.slice(supportSafePage * flatPerPage, (supportSafePage + 1) * flatPerPage),
    [supportTips, supportSafePage, flatPerPage],
  );

  const togglePrepMode = () => {
    prepModeAnim.setValue(0);
    Animated.spring(prepModeAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
    if (prepFlat) {
      setPrepDeckIndex(prepSafePage * flatPerPage);
      setPrepFlat(false);
    } else {
      setPrepPage(Math.floor(prepDeckIndex / flatPerPage));
      setPrepFlat(true);
    }
  };

  const toggleSupportMode = () => {
    supportModeAnim.setValue(0);
    Animated.spring(supportModeAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
    if (supportFlat) {
      setSupportDeckIndex(supportSafePage * flatPerPage);
      setSupportFlat(false);
    } else {
      setSupportPage(Math.floor(supportDeckIndex / flatPerPage));
      setSupportFlat(true);
    }
  };

  const openPrepPanel = () => {
    setPrepDeckIndex(0);
    setPrepDeckExiting(false);
    prepDeckExit.setValue(0);
    setPrepFlat(false);
    setPrepPage(0);
    setShowPrepPanel(true);
  };

  const openSupportPanel = () => {
    setSupportDeckIndex(0);
    setSupportDeckExiting(false);
    supportDeckExit.setValue(0);
    setSupportFlat(false);
    setSupportPage(0);
    setSelectedTip(null);
    setShowSupportPanel(true);
  };

  // 删除到最后一件时收起物品浮层
  useEffect(() => {
    if (showPrepPanel && visiblePresetItems.length === 0) setShowPrepPanel(false);
  }, [showPrepPanel, visiblePresetItems.length]);

  // 列表缩短（删除物品）后把索引拉回可见范围
  useEffect(() => {
    if (prepDeckIndex < visiblePresetItems.length) return;
    setPrepDeckIndex(0);
  }, [visiblePresetItems.length, prepDeckIndex]);

  // 退出进度只在开新动画前归零（此刻没有卡片使用 exitAnim，归零不可见）。
  // 不能在结束回调里归零：setValue 立即作用到原生视图，而索引状态要等 React
  // 提交，旧顶牌会在提交前以 opacity 1 / translateX 0 闪回原位（真机可见）。
  const advancePrepDeck = () => {
    if (prepDeckExiting || visiblePresetItems.length < 2) return;
    prepDeckExit.setValue(0);
    setPrepDeckExiting(true);
    Animated.timing(prepDeckExit, { toValue: 1, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        setPrepDeckIndex(i => (i + 1) % visiblePresetItems.length);
      }
      setPrepDeckExiting(false);
    });
  };

  const advanceSupportDeck = () => {
    if (supportDeckExiting || supportTips.length < 2) return;
    supportDeckExit.setValue(0);
    setSupportDeckExiting(true);
    Animated.timing(supportDeckExit, { toValue: 1, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        setSupportDeckIndex(i => (i + 1) % supportTips.length);
      }
      setSupportDeckExiting(false);
    });
  };

  const periods = [state.stage];
  useEffect(() => {
    if (!user) return;
    (async () => {
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
      }
    })();
  }, [user, state.stage]);

  const applyPreparation = async (itemId: string, status: 'prepared' | 'not_prepared' | 'not_needed') => {
    if (!user || !state.currentBabyId) return;
    try {
      const updated = await setUserPreparation(user.id, state.currentBabyId, itemId, status);
      setUserPreparations(prev => {
        const filtered = prev.filter(p => p.item_id !== itemId);
        return [...filtered, updated];
      });
    } catch (e) {
      console.error('Failed to update item:', e);
    }
  };

  const handleToggleItem = (itemId: string) => {
    const existing = userPreparations.find(p => p.item_id === itemId);
    applyPreparation(itemId, existing?.status === 'prepared' ? 'not_prepared' : 'prepared');
  };

  const handleRemoveItem = (itemId: string) => {
    const item = presetItems.find(i => i.id === itemId);
    const name = item?.name || '该物品';
    const message = `确定删除"${name}"吗？删除后将从列表移除。`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) applyPreparation(itemId, 'not_needed');
    } else {
      Alert.alert('删除物品', message, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => applyPreparation(itemId, 'not_needed') },
      ]);
    }
  };

  const advanceUrgentDeck = () => {
    if (deckExiting || state.urgentNotes.length < 2) return;
    deckExit.setValue(0);
    setDeckExiting(true);
    Animated.timing(deckExit, { toValue: 1, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        setDeckIndex(i => (i + 1) % state.urgentNotes.length);
      }
      setDeckExiting(false);
    });
  };

  const handleDismissUrgentNote = (noteId: string) => {
    const removeWithAnimation = () => {
      if (deckExiting) return;
      deckExit.setValue(0);
      setDeckExiting(true);
      Animated.timing(deckExit, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
        dismissUrgentNote(noteId);
        setDeckExiting(false);
      });
    };
    if (Platform.OS === 'web') {
      if (window.confirm('关闭后将不再展示，确定要关闭吗？')) removeWithAnimation();
    } else {
      Alert.alert('关闭提醒', '关闭后将不再展示，确定要关闭吗？', [
        { text: '取消', style: 'cancel' },
        { text: '确定关闭', style: 'destructive', onPress: removeWithAnimation },
      ]);
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
        <View style={styles.topBar}>
          <Text style={styles.greeting} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {state.stage === 'postpartum' ? '新晋奶爸，辛苦了' : '准爸爸，你好'}
          </Text>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setShowUrgentPanel(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="紧急关注"
            >
              <Animated.View style={{ transform: [{ rotate: bellRotation }], transformOrigin: '50% 0%' }}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={hasUrgentNotes ? colors.error : colors.muted}
                  allowFontScaling={false}
                />
              </Animated.View>
              {state.urgentNotes.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{state.urgentNotes.length > 9 ? '9+' : state.urgentNotes.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flexShrink: 1 }}>
              <BabySwitcher />
            </View>
          </View>
        </View>

        {/* ===== 孕期 / 宝宝大小 并排卡片 ===== */}
        <View style={[styles.topCardsRow, windowW < 360 && styles.topCardsRowStacked]}>
          <View style={styles.topCard}>
            <View style={styles.topCardBody}>
              <View style={styles.topCardIconCol}>
                <Ionicons name="heart-outline" size={36} color={colors.accent} allowFontScaling={false} />
              </View>
              <View style={styles.topCardInfo}>
                <View style={styles.stageRow}>
                  <Text style={styles.stageText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{stageLabel}</Text>
                  {state.babies.length > 0 && (
                    <Text style={styles.weekText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                      {state.stage === 'postpartum' ? state.birthAgeLabel : `第 ${state.weeksPregnant} 周`}
                    </Text>
                  )}
                </View>
                <Text style={styles.stageMotto} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {state.stage === 'preconception' && '调整身心，迎接新生命的到来'}
                  {state.stage === 'first' && '孕早期要格外注意休息和营养均衡'}
                  {state.stage === 'second' && '宝宝正在快速发育，保持愉悦心情'}
                  {state.stage === 'third' && '胜利在望，为宝宝的到来做最后准备'}
                  {state.stage === 'postpartum' && '新的人生阶段开始了，享受每一刻'}
                </Text>
              </View>
            </View>
          </View>
          {bumpEntry && (
            <View style={styles.topCard}>
              <View style={styles.topCardBody}>
                <View style={styles.topCardIconCol}>
                  <Ionicons name={bumpEntry.iconName} size={36} color={colors.accent} allowFontScaling={false} />
                </View>
                <View style={styles.topCardInfo}>
                  <Text style={styles.bumpFruit} maxFontSizeMultiplier={MAX_FONT_SCALE}>像 {bumpEntry.fruit} 一样大</Text>
                  <Text style={styles.bumpWeekSm} maxFontSizeMultiplier={MAX_FONT_SCALE}>第 {state.weeksPregnant} 周</Text>
                  <View style={styles.bumpMeta}>
                    <View style={styles.bumpMetaItem}>
                      <Text style={styles.bumpMetaLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>身长</Text>
                      <Text style={styles.bumpMetaValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{bumpEntry.lengthCm} cm</Text>
                    </View>
                    <View style={styles.bumpMetaDivider} />
                    <View style={styles.bumpMetaItem}>
                      <Text style={styles.bumpMetaLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>体重</Text>
                      <Text style={styles.bumpMetaValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{bumpEntry.weightG} g</Text>
                    </View>
                  </View>
                  <Text style={styles.bumpDesc} maxFontSizeMultiplier={MAX_FONT_SCALE}>{bumpEntry.description}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ===== 每日小贴士 ===== */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={17} color={colors.accent} allowFontScaling={false} />
          </View>
          <View style={styles.tipBody}>
            <Text style={styles.tipLabelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>今日贴士</Text>
            <Text style={styles.tipText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{dailyTip}</Text>
          </View>
        </View>

        {/* ===== 下次产检倒计时 ===== */}
        {state.stage !== 'preconception' && state.stage !== 'postpartum' && nextPrenatal && (
          <TouchableOpacity
            style={styles.checkupCard}
            onPress={() => router.push('/tasks')}
            activeOpacity={0.7}
          >
            <View style={styles.checkupHeader}>
              <Ionicons name="calendar-outline" size={14} color={colors.accent} allowFontScaling={false} />
              <Text style={styles.checkupHeaderTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>下次产检</Text>
            </View>
            <View style={styles.checkupBody}>
              <View style={styles.checkupRow}>
                <View style={styles.checkupIconWrap}>
                  <Ionicons name="document-text-outline" size={22} color={colors.accent} allowFontScaling={false} />
                </View>
                <View style={styles.checkupInfo}>
                  <Text style={styles.checkupLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>检查项目</Text>
                  <Text style={styles.checkupName} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{nextPrenatal.title}</Text>
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
                  ]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {daysUntilNextPrenatal! <= 0 ? '今天' : `${daysUntilNextPrenatal}`}
                  </Text>
                  <Text style={[
                    styles.checkupDaysLabel,
                    daysUntilNextPrenatal! <= 0 && styles.checkupDaysLabelUrgent,
                  ]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {daysUntilNextPrenatal! <= 0 ? '检查日' : '天后'}
                  </Text>
                </View>
              </View>
              {nextPrenatal.description ? (
                <Text style={styles.checkupDesc} maxFontSizeMultiplier={MAX_FONT_SCALE}>{nextPrenatal.description}</Text>
              ) : null}
            </View>
            <View style={styles.checkupFooter}>
              <Text style={styles.checkupHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>点击查看全部产检</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.muted} allowFontScaling={false} />
            </View>
          </TouchableOpacity>
        )}

        {/* ===== 物品准备 / 心理支持 入口 ===== */}
        {(visiblePresetItems.length > 0 || supportTips.length > 0) && (
          <View style={[styles.sectionRow, (windowW < 360 || effectiveW < 340) && styles.sectionRowStacked]}>
            {visiblePresetItems.length > 0 && (
              <TouchableOpacity
                style={styles.sectionBtn}
                onPress={openPrepPanel}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`物品准备，共 ${visiblePresetItems.length} 项`}
              >
                <Ionicons name="bag-handle-outline" size={18} color={colors.accent} allowFontScaling={false} />
                <Text style={styles.sectionBtnTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>物品准备</Text>
                <View style={styles.sectionBtnBadge}>
                  <Text style={styles.sectionBtnBadgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{visiblePresetItems.length}</Text>
                </View>
              </TouchableOpacity>
            )}
            {supportTips.length > 0 && (
              <TouchableOpacity
                style={styles.sectionBtn}
                onPress={openSupportPanel}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`心理支持，共 ${supportTips.length} 条`}
              >
                <Ionicons name="heart-outline" size={18} color={colors.info} allowFontScaling={false} />
                <Text style={styles.sectionBtnTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>心理支持</Text>
                <View style={styles.sectionBtnBadge}>
                  <Text style={styles.sectionBtnBadgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{supportTips.length}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

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

      {/* 新增紧急关注（悬浮按钮） */}
      <TouchableOpacity
        style={styles.urgentFab}
        onPress={() => { setUrgentText(''); setShowUrgentModal(true); }}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="新增紧急关注"
      >
        <Ionicons name="add" size={28} color="#fff" allowFontScaling={false} />
      </TouchableOpacity>

      {/* 新增紧急关注弹窗 */}
      <Modal visible={showUrgentModal} animationType="fade" transparent>
        <View style={styles.urgentModalOverlay}>
          <Animated.View
            style={[
              styles.urgentModalContent,
              {
                opacity: urgentModalAnim,
                transform: [
                  { translateY: urgentModalAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                  { scale: urgentModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}
          >
            <Text style={styles.urgentModalTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>新增紧急关注</Text>
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
                <Text style={styles.urgentModalCancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>取消</Text>
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
                  <Text style={styles.urgentModalSaveText} maxFontSizeMultiplier={MAX_FONT_SCALE}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 紧急关注浮层：卡牌直接堆叠，无外层容器 */}
      <Modal visible={showUrgentPanel} animationType="fade" transparent onRequestClose={() => setShowUrgentPanel(false)}>
        <Pressable style={styles.urgentModalOverlay} onPress={() => setShowUrgentPanel(false)}>
          <Animated.View
            style={[
              styles.urgentStackWrap,
              urgentFlat && styles.flatStackWrap,
              {
                opacity: urgentPanelAnim,
                transform: [
                  { translateY: urgentPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                  { scale: urgentPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <ScrollView
                style={urgentFlat ? { maxHeight: flatPanelMaxH } : undefined}
                contentContainerStyle={urgentFlat ? { paddingVertical: spacing.sm } : undefined}
                scrollEnabled={urgentFlat}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
              {state.urgentNotes.length === 0 ? (
                <View style={styles.urgentEmptyCard}>
                  <View style={styles.urgentEmptyIcon}>
                    <Ionicons name="notifications-off-outline" size={22} color={colors.muted} />
                  </View>
                  <Text style={styles.urgentEmptyText}>暂无紧急关注</Text>
                  <Text style={styles.urgentEmptyHint}>记录需要特别留意的事，随时点铃铛查看</Text>
                </View>
              ) : (
                <>
                  <Animated.View
                    style={{
                      opacity: urgentModeAnim,
                      transform: [{ scale: urgentModeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
                    }}
                  >
                  {urgentFlat ? (
                    <>
                      <View style={styles.flatRowWrap}>
                        <View style={styles.flatRow}>
                          {urgentPageNotes.map(note => (
                            <UrgentDeckCard
                              key={note.id}
                              note={note}
                              depth={0}
                              isFront
                              flat
                              flatWidth={flatCardW}
                              flatHeight={flatCardH}
                              exiting={false}
                              exitAnim={deckExit}
                              onAdvance={advanceUrgentDeck}
                              onDismiss={() => handleDismissUrgentNote(note.id)}
                              colors={colors}
                            />
                          ))}
                        </View>
                      </View>
                      <FlatPager
                        page={urgentSafePage}
                        pageCount={urgentPageCount}
                        onChange={setUrgentPage}
                      />
                    </>
                  ) : (
                    <>
                      <View style={styles.deckContainer}>
                        {urgentDeckNotes.map((note, i) => (
                          <UrgentDeckCard
                            key={note.id}
                            note={note}
                            depth={i}
                            isFront={i === 0}
                            exiting={i === 0 && deckExiting}
                            exitAnim={deckExit}
                            onAdvance={advanceUrgentDeck}
                            onDismiss={() => handleDismissUrgentNote(note.id)}
                            colors={colors}
                          />
                        ))}
                      </View>
                      {urgentDeckNotes.length > 1 && (
                        <Text style={styles.deckHint}>
                          {(deckIndex % state.urgentNotes.length) + 1} / {state.urgentNotes.length} · 轻点卡片翻看下一条
                        </Text>
                      )}
                    </>
                  )}
                  </Animated.View>
                  <DeckToggleButton expanded={urgentFlat} onPress={toggleUrgentMode} />
                </>
              )}

              <TouchableOpacity
                style={styles.urgentAddPill}
                onPress={() => {
                  setShowUrgentPanel(false);
                  setUrgentText('');
                  setShowUrgentModal(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={15} color={colors.error} />
                <Text style={styles.urgentAddPillText}>新增关注</Text>
              </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* 物品准备浮层 */}
      <Modal visible={showPrepPanel} animationType="fade" transparent onRequestClose={() => setShowPrepPanel(false)}>
        <Pressable style={styles.urgentModalOverlay} onPress={() => setShowPrepPanel(false)}>
          <Animated.View
            style={[
              styles.urgentStackWrap,
              prepFlat && styles.flatStackWrap,
              {
                opacity: prepPanelAnim,
                transform: [
                  { translateY: prepPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                  { scale: prepPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <ScrollView
                style={prepFlat ? { maxHeight: flatPanelMaxH } : undefined}
                contentContainerStyle={prepFlat ? { paddingVertical: spacing.sm } : undefined}
                scrollEnabled={prepFlat}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
              <Animated.View
                style={{
                  opacity: prepModeAnim,
                  transform: [{ scale: prepModeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
                }}
              >
              {prepFlat ? (
                <>
                  <View style={styles.flatRowWrap}>
                    <View style={styles.flatRow}>
                      {prepPageItems.map(item => {
                        const prep = userPreparations.find(p => p.item_id === item.id);
                        return (
                          <PrepDeckCard
                            key={item.id}
                            item={item}
                            isPrepared={prep?.status === 'prepared'}
                            depth={0}
                            isFront
                            flat
                            flatWidth={flatCardW}
                            flatHeight={flatCardH}
                            canAdvance={false}
                            exiting={false}
                            exitAnim={prepDeckExit}
                            onAdvance={advancePrepDeck}
                            onToggle={() => handleToggleItem(item.id)}
                            onRemove={() => handleRemoveItem(item.id)}
                            colors={colors}
                          />
                        );
                      })}
                    </View>
                  </View>
                  <FlatPager
                    page={prepSafePage}
                    pageCount={prepPageCount}
                    onChange={setPrepPage}
                  />
                </>
              ) : (
                <>
                  <View style={styles.deckContainer}>
                    {prepDeckItems.map((item, i) => {
                      const prep = userPreparations.find(p => p.item_id === item.id);
                      return (
                        <PrepDeckCard
                          key={item.id}
                          item={item}
                          isPrepared={prep?.status === 'prepared'}
                          depth={i}
                          isFront={i === 0}
                          canAdvance={visiblePresetItems.length > 1}
                          exiting={i === 0 && prepDeckExiting}
                          exitAnim={prepDeckExit}
                          onAdvance={advancePrepDeck}
                          onToggle={() => handleToggleItem(item.id)}
                          onRemove={() => handleRemoveItem(item.id)}
                          colors={colors}
                        />
                      );
                    })}
                  </View>
                  {visiblePresetItems.length > 1 && (
                    <Text style={styles.deckHint}>
                      {(prepDeckIndex % visiblePresetItems.length) + 1} / {visiblePresetItems.length} · 轻点卡片翻看下一件
                    </Text>
                  )}
                </>
              )}
              </Animated.View>
              <Text style={styles.deckSubHint}>左滑标记完成 · 右滑删除</Text>
              <DeckToggleButton expanded={prepFlat} onPress={togglePrepMode} />
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* 心理支持浮层 */}
      <Modal visible={showSupportPanel} animationType="fade" transparent onRequestClose={() => setShowSupportPanel(false)}>
        <Pressable style={styles.urgentModalOverlay} onPress={() => setShowSupportPanel(false)}>
          <Animated.View
            style={[
              styles.urgentStackWrap,
              supportFlat && !selectedTip && styles.flatStackWrap,
              {
                opacity: supportPanelAnim,
                transform: [
                  { translateY: supportPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                  { scale: supportPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <ScrollView
                style={(supportFlat || selectedTip) ? { maxHeight: flatPanelMaxH } : undefined}
                contentContainerStyle={(supportFlat || selectedTip) ? { paddingVertical: spacing.sm } : undefined}
                scrollEnabled={supportFlat || !!selectedTip}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
              {selectedTip ? (
                <View style={styles.urgentModalContent}>
                  {(() => {
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
                        <TouchableOpacity style={[styles.urgentModalSave, { marginTop: spacing.md }]} onPress={() => setSelectedTip(null)}>
                          <Text style={styles.urgentModalSaveText}>返回</Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}
                </View>
              ) : (
                <>
                  <Animated.View
                    style={{
                      opacity: supportModeAnim,
                      transform: [{ scale: supportModeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
                    }}
                  >
                  {supportFlat ? (
                    <>
                      <View style={styles.flatRowWrap}>
                        <View style={styles.flatRow}>
                          {supportPageItems.map(tip => (
                            <SupportDeckCard
                              key={tip.id}
                              tip={tip}
                              depth={0}
                              isFront
                              flat
                              flatWidth={flatCardW}
                              flatHeight={flatCardH}
                              canAdvance={false}
                              exiting={false}
                              exitAnim={supportDeckExit}
                              onAdvance={advanceSupportDeck}
                              onOpenDetail={() => setSelectedTip(tip)}
                              colors={colors}
                            />
                          ))}
                        </View>
                      </View>
                      <FlatPager
                        page={supportSafePage}
                        pageCount={supportPageCount}
                        onChange={setSupportPage}
                      />
                    </>
                  ) : (
                    <>
                      <View style={styles.deckContainer}>
                        {supportDeckItems.map((tip, i) => (
                          <SupportDeckCard
                            key={tip.id}
                            tip={tip}
                            depth={i}
                            isFront={i === 0}
                            canAdvance={supportTips.length > 1}
                            exiting={i === 0 && supportDeckExiting}
                            exitAnim={supportDeckExit}
                            onAdvance={advanceSupportDeck}
                            onOpenDetail={() => setSelectedTip(tip)}
                            colors={colors}
                          />
                        ))}
                      </View>
                      {supportTips.length > 1 && (
                        <Text style={styles.deckHint}>
                          {(supportDeckIndex % supportTips.length) + 1} / {supportTips.length} · 轻点卡片翻看下一条
                        </Text>
                      )}
                    </>
                  )}
                  </Animated.View>
                  <Text style={styles.deckSubHint}>点击「查看详情」阅读全文</Text>
                  <DeckToggleButton expanded={supportFlat} onPress={toggleSupportMode} />
                </>
              )}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
