import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { AIChat } from '../src/components/tools/AIChat';
import { spacing, typography } from '../src/styles/tokens';

export default function AIPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      paddingTop: insets.top,
    },
    navBack: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navIcon: { marginRight: spacing.sm },
    navTitle: {
      ...typography.headline,
      color: colors.fg,
      flex: 1,
    },
    chatWrap: {
      flex: 1,
      backgroundColor: colors.bg,
    },
  }), [colors, insets.top]);

  return (
    <View style={styles.container}>
      {/* 导航栏 */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBack} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Ionicons name="chatbubble-ellipses" size={20} color={colors.accent} style={styles.navIcon} />
        <Text style={styles.navTitle}>AI 助手</Text>
      </View>

      {/* 聊天区域 */}
      <View style={styles.chatWrap}>
        <AIChat userId={user?.id || ''} />
      </View>
    </View>
  );
}