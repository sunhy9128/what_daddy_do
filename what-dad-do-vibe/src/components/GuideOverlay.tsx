import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated, Platform } from 'react-native';
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

function RegionHighlight({ region, stepIdx }: { region?: string; stepIdx: number }) {
  // 简单定位提示：根据步骤展示不同位置的提示框
  const positions: Record<string, { top: number; left: number }> = {
    header: { top: 120, left: 40 },
    urgent: { top: 220, left: 20 },
    prep: { top: 360, left: 20 },
    support: { top: 460, left: 20 },
    tools: { top: 560, left: 20 },
  };
  const pos = positions[region || 'header'] || positions.header;
  return <View style={[styles.highlight, { top: pos.top, left: pos.left }]} />;
}

export function GuideOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleTap = () => {
    if (isLast) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onDismiss());
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 20, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setStep(s => s + 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.mask}>
        <RegionHighlight region={current.region} stepIdx={step} />

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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

          <Text style={styles.hint}>
            {isLast ? '点击开始使用' : `点击继续 (${step + 1}/${STEPS.length})`}
          </Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  highlight: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
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
  hint: {
    ...typography.footnote,
    color: colors.muted,
    fontWeight: '500',
  },
});

export default GuideOverlay;
