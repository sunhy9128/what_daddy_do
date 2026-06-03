import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated, Platform, useWindowDimensions, View as RNView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/tokens';

interface Step {
  title: string;
  desc: string;
  icon?: keyof typeof Ionicons.glyphMap;
  region?: 'header' | 'urgent' | 'prep' | 'support' | 'tools';
}

const STEPS: Step[] = [
  { title: '欢迎来到爸爸去哪了', desc: '新手爸爸的育儿随军参谋，帮你从容度过孕期和育儿期', icon: 'heart-outline', region: 'header' },
  { title: '紧急关注', desc: '记录需要密切关注的事项，如身体异常、产检提醒等，完成后可关闭', icon: 'alert-circle-outline', region: 'urgent' },
  { title: '物品准备', desc: '根据当前阶段列出需要准备的物品清单，点击可标记已准备', icon: 'cube-outline', region: 'prep' },
  { title: '心理支持', desc: '了解准妈妈的心理需求，学习如何更好地陪伴和支持', icon: 'chatbubble-ellipses-outline', region: 'support' },
  { title: '实用工具', desc: '点击底部 + 号添加各种工具：身高体重记录、喂奶计时、疫苗本、食物禁忌查询等', icon: 'grid-outline', region: 'tools' },
  { title: '开始使用', desc: '所有功能就绪，随时可以从底部导航栏切换页面', icon: 'rocket-outline', region: 'header' },
];

interface Rect { x: number; y: number; w: number; h: number; }

export function GuideOverlay({
  onDismiss,
  targets,
}: {
  onDismiss: () => void;
  targets?: Partial<Record<Step['region'] & string, React.RefObject<RNView | null>>>;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const { width: screenW, height: screenH } = useWindowDimensions();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // 每次 step 变化，测量对应目标 ref 的窗口位置
  useEffect(() => {
    const region = current.region;
    const ref = region ? targets?.[region] : null;
    if (!ref?.current) { setRect(null); return; }
    // 等一帧让布局稳定
    const t = setTimeout(() => {
      ref.current?.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) setRect({ x, y, w, h });
        else setRect(null);
      });
    }, 50);
    return () => clearTimeout(t);
  }, [step, targets, current.region]);

  // step 切换 / 进入时的入场动画
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.timing(ringAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [step, fadeAnim, slideAnim, ringAnim]);

  const goNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 150, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      if (isLast) onDismiss();
      else {
        setStep(s => s + 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        ringAnim.setValue(0);
      }
    });
  };

  // 4 mask 计算：挖空 rect
  const PAD = 8; // 挖空区域外扩（让目标元素周围有一圈呼吸空间）
  const RING = 2;
  let masks: { top: number; left: number; width: number; height: number }[] = [];
  let ringStyle: { top: number; left: number; width: number; height: number } | null = null;
  if (rect) {
    const x = Math.max(0, rect.x - PAD);
    const y = Math.max(0, rect.y - PAD);
    const w = Math.min(screenW, rect.w + PAD * 2);
    const h = Math.min(screenH, rect.h + PAD * 2);
    masks = [
      { top: 0, left: 0, width: screenW, height: y },                    // 顶
      { top: y + h, left: 0, width: screenW, height: screenH - y - h }, // 底
      { top: y, left: 0, width: x, height: h },                         // 左
      { top: y, left: x + w, width: screenW - x - w, height: h },        // 右
    ];
    ringStyle = { top: y, left: x, width: w, height: h };
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 4 个 mask 拼出"挖空"区域 */}
      {masks.map((m, i) => (
        <TouchableWithoutFeedback key={`mask-${i}`} onPress={goNext}>
          <View style={[styles.mask, m]} />
        </TouchableWithoutFeedback>
      ))}

      {/* 高亮 ring 描边（透传触摸到底层 UI） */}
      {ringStyle && (
        <View
          pointerEvents="none"
          style={[styles.ring, { top: ringStyle.top, left: ringStyle.left, width: ringStyle.width, height: ringStyle.height, borderWidth: RING }]}
        />
      )}

      {/* 底部说明卡（挖空上方时也允许触摸穿透，避免遮挡视觉） */}
      <View style={styles.cardWrap} pointerEvents="box-none">
        <Animated.View
          pointerEvents="box-none"
          style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.stepDots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          {current.icon && (
            <View style={styles.iconWrap}>
              <Ionicons name={current.icon} size={28} color={colors.accent} />
            </View>
          )}

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.desc}>{current.desc}</Text>

          <TouchableWithoutFeedback onPress={goNext}>
            <View style={styles.hintBtn}>
              <Text style={styles.hint}>
                {isLast ? '点击开始使用' : `点击继续 (${step + 1}/${STEPS.length})`}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(26,26,46,0.62)', // 墨蓝半透明，跟 kami 主色一致
  },
  ring: {
    position: 'absolute',
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.85)',
    borderStyle: 'solid',
  },
  cardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
    borderRadius: 3,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title3,
    fontWeight: '700',
    color: colors.fg,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  desc: {
    ...typography.callout,
    color: colors.fgSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  hintBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  hint: {
    ...typography.footnote,
    color: colors.muted,
    fontWeight: '500',
  },
});

export default GuideOverlay;
