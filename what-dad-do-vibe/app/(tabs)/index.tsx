import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { Card, ProgressBar } from '../../src/components/atoms';
import { TaskCard, KnowledgeCard, RecordEntry } from '../../src/components/molecules';
import { colors, spacing, typography } from '../../src/styles/tokens';

const STAGES = [
  { key: 'preconception', label: '备孕', weeks: '0-4周' },
  { key: 'first', label: '孕早期', weeks: '1-12周' },
  { key: 'second', label: '孕中期', weeks: '13-27周' },
  { key: 'third', label: '孕晚期', weeks: '28-40周' },
] as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, toggleTask } = useApp();
  const { session, loading: authLoading } = useAuth();
  const [currentStage, setCurrentStage] = useState(state.stage);

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.isCompleted).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  const stageLabel = STAGES.find(s => s.key === currentStage)?.label || '孕晚期';
  const incompleteTasks = state.tasks.filter(t => !t.isCompleted);
  const todayTasks = incompleteTasks.slice(0, 3);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>准爸爸，你好 👋</Text>
          <Text style={styles.stageText}>{stageLabel}</Text>
        </View>

        {/* Progress Ring */}
        <Card style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.ringContainer}>
              <View style={styles.ring}>
                <Text style={styles.ringText}>{progress}%</Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>本周任务完成度</Text>
              <Text style={styles.progressSubtitle}>
                {incompleteTasks.length > 0 ? `还需完成${incompleteTasks.length}项任务` : '太棒了，全部完成！'}
              </Text>
            </View>
          </View>
          <ProgressBar value={progress} />
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/tasks')}>
            <View style={[styles.quickIcon, { backgroundColor: '#e0f2fe' }]}>
              <Text style={styles.quickIconText}>✓</Text>
            </View>
            <Text style={styles.quickLabel}>查看任务</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/records')}>
            <View style={[styles.quickIcon, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.quickIconText}>✎</Text>
            </View>
            <Text style={styles.quickLabel}>写记录</Text>
          </TouchableOpacity>
        </View>

        {/* Knowledge Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>本周需要</Text>
        </View>
        <Card>
          <KnowledgeCard emoji="🫁" title="孕26-28周该做什么" readTime="3分钟阅读" />
          <KnowledgeCard emoji="👶" title="宝宝胎动怎么数？" readTime="5分钟阅读" />
          <KnowledgeCard emoji="🏥" title="待产包清单" readTime="4分钟阅读" />
        </Card>

        {/* Records Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近记录</Text>
        </View>
        <Card>
          {state.records.slice(0, 2).map(record => (
            <RecordEntry
              key={record.id}
              title={record.title}
              content={record.content}
              time={record.createdAt}
              isPrivate={record.isPrivate}
            />
          ))}
          {state.records.length === 0 && (
            <Text style={styles.emptyText}>暂无记录，去记录页创建</Text>
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
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

  // Progress
  progressCard: { marginTop: 0 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  ringContainer: { marginRight: spacing.md },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { ...typography.title3, fontWeight: '600' },
  progressInfo: { flex: 1 },
  progressTitle: { ...typography.callout, fontWeight: '600', marginBottom: spacing.xs },
  progressSubtitle: { ...typography.footnote, color: colors.muted },

  // Quick Actions
  quickActions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    alignItems: 'center',
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickIconText: { fontSize: 16, color: colors.accent },
  quickLabel: { ...typography.footnote, fontWeight: '500' },

  // Section
  sectionHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { ...typography.caption1, fontWeight: '600', color: colors.muted, textTransform: 'uppercase' },
  emptyText: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
});