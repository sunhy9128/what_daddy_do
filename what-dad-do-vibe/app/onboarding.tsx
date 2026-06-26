import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ListRenderItem,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useApp } from '../src/context/AppContext';
import { useColors } from '../src/context/ThemeContext';
import { spacing, typography, radius } from '../src/styles/tokens';
import { AVAILABLE_TOOLS } from '../src/components/tools/Toolbar';
import { ToolDefinition } from '../src/components/tools/ToolBase';
import { saveActiveTools, saveOnboardingCompleted, StoredToolInstance } from '../src/lib/storage';

// 默认勾选的 3 个工具 id（按阶段过滤）
const DEFAULT_PICKED_IDS = ['prenatal-timeline', 'food-safety', 'mood-checkin'];

interface FeatureCard {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}

const FEATURES: FeatureCard[] = [
  { icon: 'calendar-outline', title: '智能任务', desc: '基于孕周智能生成每周任务，产检营养不再遗漏' },
  { icon: 'grid-outline', title: '实用工具', desc: '21 个工具随用随选，宫缩胎动食物禁忌一站搞定' },
  { icon: 'heart-outline', title: '情感陪伴', desc: '不只是工具，更是陪你和妈妈一起迎接新生命' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { state } = useApp();
  const colors = useColors();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState(0); // 0 或 1
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set(DEFAULT_PICKED_IDS));
  const listRef = useRef<FlatList>(null);
  const finishingRef = useRef(false);

  // 当前阶段可见的工具（用于第 2 步推荐）
  const visibleTools: ToolDefinition[] = useMemo(() => {
    const currentStage = state.stage;
    return AVAILABLE_TOOLS.filter(t => {
      if (!t.hideInStages) return true;
      return !t.hideInStages.includes(currentStage as 'preconception' | 'first' | 'second' | 'third' | 'postpartum');
    });
  }, [state.stage]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    skipText: {
      ...typography.callout,
      color: colors.muted,
      fontWeight: '500',
    },
    dots: {
      flexDirection: 'row',
      gap: 6,
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
    page: {
      width, // 横向分页：每页宽度 = 屏幕宽度
      flex: 1,
      paddingHorizontal: spacing.xl,
    },
    // ── Step 1: 欢迎页 ──
    welcomeWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: spacing.xxl,
    },
    logoCircle: {
      width: 96,
      height: 96,
      borderRadius: radius.xl,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    welcomeTitle: {
      ...typography.largeTitle,
      fontWeight: '700',
      color: colors.fg,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    welcomeSubtitle: {
      ...typography.callout,
      color: colors.fgSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xl,
    },
    featuresCol: {
      width: '100%',
      gap: spacing.md,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    featureIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTextCol: { flex: 1 },
    featureTitle: {
      ...typography.headline,
      color: colors.fg,
      fontWeight: '600',
      marginBottom: 2,
    },
    featureDesc: {
      ...typography.footnote,
      color: colors.fgSecondary,
      lineHeight: 18,
    },
    // ── Step 2: 选工具 ──
    toolsHeader: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    toolsTitle: {
      ...typography.title2,
      fontWeight: '700',
      color: colors.fg,
      marginBottom: spacing.xs,
    },
    toolsSubtitle: {
      ...typography.subhead,
      color: colors.fgSecondary,
      marginBottom: spacing.md,
    },
    toolsCount: {
      ...typography.footnote,
      color: colors.muted,
      marginBottom: spacing.sm,
    },
    toolsGrid: {
      paddingBottom: spacing.md,
    },
    toolItem: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    toolItemPicked: {
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    toolIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolIconWrapPicked: {
      backgroundColor: '#fff',
    },
    toolInfo: { flex: 1 },
    toolName: {
      ...typography.headline,
      color: colors.fg,
      fontWeight: '600',
      marginBottom: 2,
    },
    toolDesc: {
      ...typography.footnote,
      color: colors.fgSecondary,
      lineHeight: 18,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    checkboxPicked: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    // ── 底部按钮 ──
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
    },
    primaryBtn: {
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    primaryBtnText: {
      ...typography.headline,
      color: '#fff',
      fontWeight: '600',
    },
    swipeHint: {
      ...typography.footnote,
      color: colors.muted,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  }), [colors, width]);

  const totalSteps = 2;

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newStep = Math.round(x / width);
    if (newStep !== step) setStep(newStep);
  }, [step, width]);

  const scrollToStep = useCallback((target: number) => {
    listRef.current?.scrollToOffset({ offset: target * width, animated: true });
    setStep(target);
  }, [width]);

  const togglePick = useCallback((id: string) => {
    setPickedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const finish = useCallback(async (withPicks: boolean) => {
    if (finishingRef.current || !user) return;
    finishingRef.current = true;
    try {
      await saveOnboardingCompleted(user.id, true);
      if (withPicks) {
        const tools: StoredToolInstance[] = Array.from(pickedIds).map((toolId, idx) => ({
          instanceId: `tool-onboard-${idx}-${Date.now()}`,
          toolId,
        }));
        await saveActiveTools(user.id, tools);
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding finish failed', e);
      finishingRef.current = false;
    }
  }, [user, pickedIds, router]);

  const skip = useCallback(() => {
    finish(false);
  }, [finish]);

  const renderWelcome: ListRenderItem<number> = useCallback(({ item }) => {
    if (item !== 0) return null;
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <View style={styles.welcomeWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="heart" size={48} color={colors.accent} />
          </View>
          <Text style={styles.welcomeTitle}>欢迎来到爸爸去哪了</Text>
          <Text style={styles.welcomeSubtitle}>
            新手爸爸的孕育随军参谋{'\n'}陪你和妈妈一起迎接新生命
          </Text>
          <View style={styles.featuresCol}>
            {FEATURES.map(f => (
              <View key={f.title} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={22} color={colors.accent} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }, [styles, insets.top, colors.accent]);

  const renderTools: ListRenderItem<number> = useCallback(({ item }) => {
    if (item !== 1) return null;
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <View style={styles.toolsHeader}>
          <Text style={styles.toolsTitle}>选几个常用工具</Text>
          <Text style={styles.toolsSubtitle}>根据你的阶段推荐，点击卡片切换是否添加</Text>
          <Text style={styles.toolsCount}>已选 {pickedIds.size} / {visibleTools.length}</Text>
        </View>
        <FlatList
          data={visibleTools}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.toolsGrid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: tool }) => {
            const picked = pickedIds.has(tool.id);
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => togglePick(tool.id)}
                style={[styles.toolItem, picked && styles.toolItemPicked]}
              >
                <View style={[styles.toolIconWrap, picked && styles.toolIconWrapPicked]}>
                  <Ionicons name={tool.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.accent} />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <Text style={styles.toolDesc}>{tool.description}</Text>
                </View>
                <View style={[styles.checkbox, picked && styles.checkboxPicked]}>
                  {picked && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }, [styles, insets.top, visibleTools, pickedIds, colors.accent, togglePick]);

  const renderPage: ListRenderItem<number> = useCallback(({ item }) => {
    if (item === 0) return renderWelcome({ item, index: 0, separators: {} as never });
    return renderTools({ item, index: 1, separators: {} as never });
  }, [renderWelcome, renderTools]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部栏：dots + 跳过 */}
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>跳过</Text>
        </TouchableOpacity>
      </View>

      {/* 横向滑动分页 */}
      <FlatList
        ref={listRef}
        data={[0, 1]}
        keyExtractor={i => `step-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!finishingRef.current}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={renderPage}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* 底部主按钮 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {step === 0 ? (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={() => scrollToStep(1)}
            >
              <Text style={styles.primaryBtnText}>下一张</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.swipeHint}>或左滑查看下一步</Text>
          </>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => finish(true)}
            disabled={finishingRef.current}
          >
            <Text style={styles.primaryBtnText}>完成，开始使用</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}