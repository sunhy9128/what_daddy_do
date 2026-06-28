import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useColors } from '../src/context/ThemeContext';
import { spacing, typography, radius, shadows } from '../src/styles/tokens';
import { AVAILABLE_TOOLS } from '../src/components/tools/Toolbar';
import { FeedingTimer } from '../src/components/tools/FeedingTimer';
import { GrowthTracker } from '../src/components/tools/GrowthTracker';
import { VaccineTracker } from '../src/components/tools/VaccineTracker';
import { VaccineCalendar } from '../src/components/tools/VaccineCalendar';
import { FoodSafetyTool } from '../src/components/tools/FoodSafety';
import { PrenatalTimeline } from '../src/components/tools/PrenatalTimeline';
import { ContractionTimer } from '../src/components/tools/ContractionTimer';
import { KickCounter } from '../src/components/tools/KickCounter';
import { MomWeightTracker } from '../src/components/tools/MomWeightTracker';
import { HospitalBag } from '../src/components/tools/HospitalBag';
import { MoodCheckIn } from '../src/components/tools/MoodCheckIn';
import { MedicationSafetyTool } from '../src/components/tools/MedicationSafety';
import { BabyMedicationSafetyTool } from '../src/components/tools/BabyMedicationSafety';
import { BabyCareLog } from '../src/components/tools/BabyCareLog';
import { BabySleepLog } from '../src/components/tools/BabySleepLog';
import { BabyFoodRecipeTool } from '../src/components/tools/BabyFoodRecipe';
import { ChildCheckupTool } from '../src/components/tools/ChildCheckup';
import { DadDeliveryPrep } from '../src/components/tools/DadDeliveryPrep';
import { OvulationTracker } from '../src/components/tools/OvulationTracker';

interface ToolComponentProps {
  userId: string;
  babyGender?: string;
  expanded?: boolean;
}

const TOOL_COMPONENTS: Record<string, React.FC<ToolComponentProps>> = {
  'feeding-timer': FeedingTimer,
  'growth-tracker': GrowthTracker,
  'vaccine-tracker': VaccineTracker,
  'vaccine-calendar': VaccineCalendar,
  'food-safety': FoodSafetyTool,
  'prenatal-timeline': PrenatalTimeline,
  'contraction-timer': ContractionTimer,
  'kick-counter': KickCounter,
  'mom-weight': MomWeightTracker,
  'hospital-bag': HospitalBag,
  'mood-checkin': MoodCheckIn,
  'medication-safety': MedicationSafetyTool,
  'baby-medication-safety': BabyMedicationSafetyTool,
  'baby-food-recipe': BabyFoodRecipeTool,
  'child-checkup': ChildCheckupTool,
  'baby-care-log': BabyCareLog,
  'baby-sleep-log': BabySleepLog,
  'dad-delivery-prep': DadDeliveryPrep,
  'ovulation-tracker': OvulationTracker,
};

// 工具垂直对齐方式 — top 的顶对齐，其余默认 center 居中
const TOOL_JUSTIFY: Record<string, 'center' | 'flex-start'> = {
  'hospital-bag': 'flex-start',
  'food-safety': 'flex-start',
  'medication-safety': 'flex-start',
  'baby-medication-safety': 'flex-start',
  'baby-care-log': 'flex-start',
  'baby-food-recipe': 'flex-start',
  'child-checkup': 'flex-start',
  'ovulation-tracker': 'flex-start',
};

export default function ToolDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toolId } = useLocalSearchParams<{ toolId: string }>();
  const { user } = useAuth();
  const colors = useColors();

  const def = useMemo(() => AVAILABLE_TOOLS.find(t => t.id === toolId), [toolId]);
  const Component = toolId ? TOOL_COMPONENTS[toolId] : undefined;
  const justify = toolId ? (TOOL_JUSTIFY[toolId] || 'center') : 'center';

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    // 导航栏 — Kami 标准：surface 底、hairline 分隔、title3 标题
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    navBack: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    navTitle: {
      ...typography.title3,
      fontWeight: '600',
      color: colors.fg,
      flex: 1,
    },
    navIcon: {
      marginRight: spacing.sm,
    },

    // 工具卡片容器
    scrollContent: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingBottom: spacing.xxl + insets.bottom,
    },
    toolCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.lg,
      borderWidth: 0.5,
      borderColor: colors.border,
      ...shadows.sm,
    },

    // 未找到工具
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    notFoundIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    notFoundTitle: {
      ...typography.title3,
      fontWeight: '600',
      color: colors.fg,
      marginBottom: spacing.xs,
    },
    notFoundDesc: {
      ...typography.callout,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    backBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.sm,
      backgroundColor: colors.accent,
    },
    backBtnText: {
      ...typography.callout,
      fontWeight: '600',
      color: '#fff',
    },
  }), [colors, insets]);

  if (!def || !Component) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.bg }]}>
        <View style={styles.notFoundIcon}>
          <Ionicons name="help-circle-outline" size={36} color={colors.muted} />
        </View>
        <Text style={styles.notFoundTitle}>未知工具</Text>
        <Text style={styles.notFoundDesc}>请返回首页重新选择</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>返回首页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kami 导航栏 */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBack} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </TouchableOpacity>
        <Ionicons name={def.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.accent} style={styles.navIcon} />
        <Text style={styles.navTitle} numberOfLines={1}>{def.name}</Text>
      </View>

      {/* 工具内容 — 暖羊皮纸背景上置入暖白卡片 */}
      <ScrollView contentContainerStyle={[styles.scrollContent, { justifyContent: justify }]} showsVerticalScrollIndicator={false}>
        <View style={styles.toolCard}>
          <Component userId={user?.id || ''} expanded />
        </View>
      </ScrollView>
    </View>
  );
}
