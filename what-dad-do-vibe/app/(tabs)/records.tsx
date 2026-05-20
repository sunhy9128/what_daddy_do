import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { Card, Button } from '../../src/components/atoms';
import { RecordEntry } from '../../src/components/molecules';
import { SegmentControl } from '../../src/components/organisms';
import { colors, spacing, typography } from '../../src/styles/tokens';

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { state, addRecord, removeRecord } = useApp();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('错误', '请填写标题');
      return;
    }
    await addRecord({ title: newTitle.trim(), content: newContent.trim(), isPrivate });
    setNewTitle('');
    setNewContent('');
    setIsPrivate(false);
    setShowNewModal(false);
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
                <Text style={styles.toolIcon}>{isPrivate ? '🔒' : '🌍'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.postBtn} onPress={() => setShowNewModal(true)}>
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
            />
          ))}
          {filteredRecords.length === 0 && (
            <Text style={styles.emptyText}>暂无记录</Text>
          )}
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowNewModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* New Record Modal */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新建记录</Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="标题"
              placeholderTextColor={colors.muted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="内容"
              placeholderTextColor={colors.muted}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={6}
            />

            <TouchableOpacity style={styles.privacyToggle} onPress={() => setIsPrivate(!isPrivate)}>
              <Text style={styles.privacyIcon}>{isPrivate ? '🔒' : '🌍'}</Text>
              <Text style={styles.privacyLabel}>{isPrivate ? '私密' : '公开'}</Text>
            </TouchableOpacity>

            <Button title="保存" variant="primary" onPress={handleCreate} />
          </View>
        </View>
      </Modal>
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
  toolIcon: { fontSize: 20 },
  postBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  postBtnText: {
    color: colors.surface,
    ...typography.footnote,
    fontWeight: '600',
  },
  emptyText: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, color: colors.surface },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.title3, fontWeight: '600' },
  modalCancel: { ...typography.callout, color: colors.accent },
  modalInput: {
    ...typography.callout,
    color: colors.fg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modalTextArea: { minHeight: 120, textAlignVertical: 'top' },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  privacyIcon: { fontSize: 20 },
  privacyLabel: { ...typography.callout },
});