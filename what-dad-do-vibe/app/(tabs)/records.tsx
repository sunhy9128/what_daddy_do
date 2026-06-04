import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { Card } from '../../src/components/atoms';
import { RecordEntry } from '../../src/components/molecules';
import { SegmentControl } from '../../src/components/organisms';
import { colors, spacing, radius, typography } from '../../src/styles/tokens';

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { state, addRecord, removeRecord } = useApp();
  const [newContent, setNewContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [filter, setFilter] = useState('all');
  const postingRef = useRef(false);

  // 快速发布：直接保存 inline 内容，自动用首段文字做标题
  const handleQuickPost = async () => {
    if (postingRef.current) return;
    if (!newContent.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }
    postingRef.current = true;
    try {
      const title = newContent.trim().split('\n')[0].slice(0, 30) || '随手记';
      await addRecord({ title, content: newContent.trim(), isPrivate });
      setNewContent('');
    } catch (e) { console.error('Failed to add record:', e); } finally {
      postingRef.current = false;
    }
  };

  const filteredRecords = state.records.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'public') return !r.isPrivate;
    if (filter === 'private') return r.isPrivate;
    return true;
  });

  if (state.loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>记录</Text>
          <Text style={styles.subtitle}>记录你的育儿心路</Text>
        </View>

        {/* New Post */}
        <Card style={styles.newPostCard}>
          <TextInput
            style={styles.newPostInput}
            placeholder="记录今天的心情..."
            placeholderTextColor={colors.muted}
            value={newContent}
            onChangeText={setNewContent}
            multiline
            numberOfLines={3}
          />
          <View style={styles.newPostFooter}>
            <View style={styles.postTools}>
              <TouchableOpacity style={styles.toolBtn} onPress={() => setIsPrivate(!isPrivate)}>
                <Ionicons name={isPrivate ? 'lock-closed' : 'globe-outline'} size={22} color={isPrivate ? colors.accent : colors.muted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.postBtn} onPress={handleQuickPost}>
              <Text style={styles.postBtnText}>发布</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Filter */}
        <SegmentControl
          segments={['全部', '公开', '私密']}
          activeSegment={filter === 'all' ? '全部' : filter === 'public' ? '公开' : '私密'}
          onSegmentChange={(seg) => setFilter(seg === '全部' ? 'all' : seg === '公开' ? 'public' : 'private')}
        />

        {/* Records */}
        <Card>
          {filteredRecords.map(record => (
            <RecordEntry
              key={record.id}
              title={record.title}
              content={record.content}
              time={record.createdAt}
              isPrivate={record.isPrivate}
              onDelete={() => removeRecord(record.id)}
            />
          ))}
          {filteredRecords.length === 0 && (
            <Text style={styles.emptyText}>暂无记录</Text>
          )}
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  title: { ...typography.largeTitle, fontWeight: '700' },
  subtitle: { ...typography.callout, color: colors.muted, marginTop: spacing.xs },
  newPostCard: { marginTop: 0 },
  newPostInput: {
    ...typography.callout,
    color: colors.fg,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  newPostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  postTools: { flexDirection: 'row', gap: spacing.md },
  toolBtn: { padding: spacing.xs },

  postBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  postBtnText: {
    color: colors.surface,
    ...typography.footnote,
    fontWeight: '600',
  },
  emptyText: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
});
