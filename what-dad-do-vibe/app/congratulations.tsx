import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { Confetti } from '../src/components/Confetti';
import { colors, spacing, radius, typography } from '../src/styles/tokens';

export default function CongratulationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, updateBabyGender } = useApp();
  const baby = state.babies[0];
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Confetti />
      <View style={styles.content}>
        {/* 标题 */}
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>恭喜升级！</Text>
        <Text style={styles.subtitle}>
          宝宝已经平安来到这个世界{'\n'}准备好迎接全新的旅程了吗？
        </Text>

        {/* 性别选择 */}
        <Text style={styles.prompt}>宝宝是？</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, selectedGender === 'boy' && styles.genderBtnBoy]}
            onPress={() => setSelectedGender('boy')}
          >
            <Text style={[styles.genderIcon, selectedGender === 'boy' && styles.genderIconActive]}>
              👦
            </Text>
            <Text style={[styles.genderLabel, selectedGender === 'boy' && styles.genderLabelActive]}>
              小王子
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, selectedGender === 'girl' && styles.genderBtnGirl]}
            onPress={() => setSelectedGender('girl')}
          >
            <Text style={[styles.genderIcon, selectedGender === 'girl' && styles.genderIconActive]}>
              👧
            </Text>
            <Text style={[styles.genderLabel, selectedGender === 'girl' && styles.genderLabelActive]}>
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
          <Text style={styles.confirmText}>{saving ? '保存中...' : '恭喜！开始新旅程'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  content: {
    flex: 1,
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
    borderColor: '#4D96FF',
    backgroundColor: '#F0F7FF',
  },
  genderBtnGirl: {
    borderColor: '#F472B6',
    backgroundColor: '#FFF0F6',
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
});
