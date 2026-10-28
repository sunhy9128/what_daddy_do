import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { Confetti } from '../src/components/Confetti';
import { useColors, useTheme } from '../src/context/ThemeContext';
import { spacing, radius, typography, MAX_FONT_SCALE } from '../src/styles/tokens';

export default function CongratulationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, updateBabyGender } = useApp();
  const { babyId } = useLocalSearchParams<{ babyId?: string }>();
  const baby = babyId
    ? state.babies.find(b => b.id === babyId)
    : state.babies.find(b => b.id === state.currentBabyId) || state.babies[0];
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const colors = useColors();
  const { isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1E1C18' : '#FAF8F3',
  },
  content: {
    // 放在 ScrollView 里：大字号时内容可滚动
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.largeTitle,
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.callout,
    color: colors.fgSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  prompt: {
    ...typography.headline,
    fontWeight: '600',
    color: colors.fg,
    marginBottom: spacing.md,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  genderBtn: {
    width: 120,
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  genderBtnBoy: {
    borderColor: '#647B85',
    backgroundColor: isDark ? '#232B2E' : '#EDF0F0',
  },
  genderBtnGirl: {
    borderColor: '#C9A6A0',
    backgroundColor: isDark ? '#332A26' : '#F4EBE8',
  },
  genderIcon: {
    fontSize: 44,
    opacity: 0.5,
  },
  genderIconActive: {
    opacity: 1,
  },
  genderLabel: {
    ...typography.callout,
    fontWeight: '500',
    color: colors.muted,
  },
  genderLabelActive: {
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    ...typography.callout,
    fontWeight: '700',
    color: '#fff',
    fontSize: 18,
  },
  skipBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    ...typography.callout,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
}), [colors, isDark]);

  const handleConfirm = async () => {
    if (!selectedGender || !baby || saving) return;
    setSaving(true);
    try {
      // 更新性别 + 记录实际出生日期 + 将预产期调整为今天
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      await updateBabyGender(baby.id, selectedGender, dateStr, dateStr);
      router.replace('/(tabs)');
    } catch {
      setSaving(false);
    }
  };

  const handleNotYetBorn = () => {
    if (!baby) return;
    router.replace(`/baby-info?babyId=${baby.id}&from=congratulations`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Confetti />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 标题 */}
        <Ionicons name="happy-outline" size={64} color={colors.accent} style={{ marginBottom: spacing.lg }} allowFontScaling={false} />
        <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>恭喜升级！</Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          宝宝已经平安来到这个世界{'\n'}准备好迎接全新的旅程了吗？
        </Text>

        {/* 性别选择 */}
        <Text style={styles.prompt} maxFontSizeMultiplier={MAX_FONT_SCALE}>宝宝是？</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, selectedGender === 'boy' && styles.genderBtnBoy]}
            onPress={() => setSelectedGender('boy')}
          >
            <Ionicons
              name="man-outline"
              size={44}
              color={selectedGender === 'boy' ? '#647B85' : colors.fgSecondary}
              style={{ opacity: selectedGender === 'boy' ? 1 : 0.5 }}
              allowFontScaling={false}
            />
            <Text style={[styles.genderLabel, selectedGender === 'boy' && styles.genderLabelActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              小王子
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, selectedGender === 'girl' && styles.genderBtnGirl]}
            onPress={() => setSelectedGender('girl')}
          >
            <Ionicons
              name="woman-outline"
              size={44}
              color={selectedGender === 'girl' ? '#C9A6A0' : colors.fgSecondary}
              style={{ opacity: selectedGender === 'girl' ? 1 : 0.5 }}
              allowFontScaling={false}
            />
            <Text style={[styles.genderLabel, selectedGender === 'girl' && styles.genderLabelActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              小公主
            </Text>
          </TouchableOpacity>
        </View>

        {/* 确认按钮 */}
        <TouchableOpacity
          style={[styles.confirmBtn, !selectedGender && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedGender || saving}
        >
          <Text style={styles.confirmText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{saving ? '保存中...' : '恭喜！开始新旅程'}</Text>
        </TouchableOpacity>

        {/* 还未出生 */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleNotYetBorn}>
          <Text style={styles.skipText} maxFontSizeMultiplier={MAX_FONT_SCALE}>宝宝还未出生</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

