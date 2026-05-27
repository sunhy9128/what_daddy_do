import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { Toolbar } from '../../src/components/tools/Toolbar';
import { loadActiveTools, saveActiveTools } from '../../src/lib/storage';
import { useAuth } from '../../src/context/AuthContext';

import { colors, spacing, typography } from '../../src/styles/tokens';

import { STAGES } from '../../src/lib/stages';

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
  const nextToolId = useRef(1);
  const [activeTools, setActiveTools] = useState<{ instanceId: string; toolId: string }[]>([]);

  // 加载/保存工具配置
  useEffect(() => {
    if (!user) return;
    loadActiveTools(user.id).then(tools => {
      setActiveTools(tools);
      nextToolId.current = tools.length + 1;
    });
  }, [user]);

  useEffect(() => {
    if (!user || activeTools.length === 0) return;
    saveActiveTools(user.id, activeTools);
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
              <Text style={styles.weekText}>第 {state.weeksPregnant} 周</Text>
            )}
          </View>
        </View>

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

        {/* 工具栏 */}
        <Toolbar
          activeTools={activeTools}
          userId={user?.id || ''}
          babyGender={state.babies[0]?.gender}
          onAddTool={(toolId) => {
            if (activeTools.some(t => t.toolId === toolId)) return;
            setActiveTools(prev => [...prev, { instanceId: `tool-${nextToolId.current++}`, toolId }]);
          }}
          onRemoveTool={(instanceId) => setActiveTools(prev => prev.filter(t => t.instanceId !== instanceId))}
          onReorder={(tools) => setActiveTools(tools)}
        />

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
                style={[styles.urgentModalSave, !urgentText.trim() && styles.urgentModalSaveDisabled]}
                onPress={async () => {
                  if (!urgentText.trim()) return;
                  await addUrgentNote(urgentText.trim());
                  setUrgentText('');
                  setShowUrgentModal(false);
                }}
                disabled={!urgentText.trim()}
              >
                <Text style={styles.urgentModalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E6D0',
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
    backgroundColor: '#D97706',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  urgentText: {
    ...typography.callout,
    color: '#92400E',
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
    color: '#D97706',
    fontWeight: '400',
  },
  urgentAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  urgentAddIcon: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '600',
  },
  urgentAddText: {
    ...typography.footnote,
    color: colors.accent,
    fontWeight: '500',
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

});