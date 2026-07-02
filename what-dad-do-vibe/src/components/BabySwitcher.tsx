import { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet, TextInput, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { useColors } from '../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../styles/tokens';
import { calculateStageFromDueDate, calculateBirthAge } from '../lib/stages';

function getBabyWeekLabel(baby: { dueDate?: string | null; birthDate?: string | null }): { text: string; type: 'postpartum' | 'pregnant' | 'preconception' } | null {
  if (!baby.dueDate) return null;
  const { stage, weeksPregnant } = calculateStageFromDueDate(baby.dueDate);
  if (stage === 'postpartum') {
    const age = calculateBirthAge(baby.dueDate, baby.birthDate);
    return age ? { text: age, type: 'postpartum' } : null;
  }
  if (stage === 'preconception') return { text: '备孕中', type: 'preconception' };
  return { text: `第${weeksPregnant}周`, type: 'pregnant' };
}

export function BabySwitcher() {
  const { state, setActiveBaby, updateBabyGender } = useApp();
  const [open, setOpen] = useState(false);
  const [editingBaby, setEditingBaby] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const colors = useColors();

  const current = state.babies.find(b => b.id === state.currentBabyId);
  const active = state.babies.filter(b => !b.is_archived);

  const startEditing = useCallback((baby: typeof active[0]) => {
    setEditingBaby({ id: baby.id, name: baby.name || '宝宝' });
    setEditName(baby.name || '宝宝');
  }, []);

  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed || !editingBaby) return;
    setSaving(true);
    try {
      await updateBabyGender(editingBaby.id, '', undefined, undefined, trimmed);
      setEditingBaby(null);
    } catch (e) {
      // 统一使用 Alert 处理
      if (Platform.OS === 'web') {
        window.alert('保存失败，请重试');
      } else {
        Alert.alert('保存失败', '请重试');
      }
    } finally {
      setSaving(false);
    }
  }, [editName, editingBaby, updateBabyGender]);

  const styles = StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    pillText: {
      ...typography.footnote,
      fontWeight: '600',
      color: colors.fg,
      maxWidth: 80,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 100,
    },
    sheet: {
      width: '80%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    sheetTitle: {
      ...typography.title3,
      fontWeight: '700',
      color: colors.fg,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },
    rowActive: {
      backgroundColor: colors.accent + '15',
    },
    rowName: {
      ...typography.callout,
      fontWeight: '600',
      color: colors.fg,
      flex: 1,
    },
    rowTag: {
      ...typography.caption1,
      color: colors.muted,
    },
    rowWeek: {
      ...typography.caption2,
      fontWeight: '600',
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    rowWeekPregnant: {
      backgroundColor: colors.accent + '18',
      color: colors.accent,
    },
    rowWeekPostpartum: {
      backgroundColor: colors.success + '18',
      color: colors.success,
    },
    rowWeekPreconception: {
      backgroundColor: colors.surfaceSecondary,
      color: colors.muted,
    },
    editBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },
    actionText: {
      ...typography.callout,
      color: colors.accent,
      fontWeight: '500',
    },

    // ===== 编辑姓名弹窗 =====
    editOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    editSheet: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
    },
    editTitle: {
      ...typography.title3,
      fontWeight: '700',
      color: colors.fg,
      marginBottom: spacing.xs,
    },
    editHint: {
      ...typography.footnote,
      color: colors.muted,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    editInput: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
      height: 44,
    },
    editActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    editCancel: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
    },
    editCancelText: {
      ...typography.callout,
      color: colors.muted,
    },
    editSave: {
      backgroundColor: colors.accent,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
      minWidth: 60,
      alignItems: 'center',
    },
    editSaveDisabled: {
      opacity: 0.5,
    },
    editSaveText: {
      ...typography.callout,
      fontWeight: '600',
      color: '#fff',
    },

    // ===== 切换宝宝 Loading =====
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    loadingBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl,
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 140,
      ...shadows.lg,
    },
    loadingText: {
      ...typography.callout,
      color: colors.fgSecondary,
      fontWeight: '500',
    },
  });

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.pill}
        accessibilityRole="button"
        accessibilityLabel={`切换宝宝，当前 ${current?.name ?? '未选择'}`}
      >
        <View style={styles.pillLeft}>
          <Ionicons name="happy-outline" size={16} color={colors.accent} />
          <Text style={styles.pillText} numberOfLines={1}>
            {current?.name || '选择宝宝'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={14} color={colors.muted} />
      </Pressable>

      {/* 切换宝宝弹窗 */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>切换宝宝</Text>

            {active.length === 0 && (
              <Text style={[typography.callout, { color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg }]}>
                暂无宝宝，请先添加
              </Text>
            )}

            <FlatList
              data={active}
              keyExtractor={b => b.id}
              ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
              renderItem={({ item }) => {
                const isCurrent = item.id === state.currentBabyId;
                return (
                  <View style={[styles.row, isCurrent && styles.rowActive]}>
                    <Pressable
                      onPress={async () => {
                        if (switching || isCurrent) return;
                        setSwitching(true);
                        await setActiveBaby(item.id);
                        setOpen(false);
                        setSwitching(false);
                      }}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                    >
                      <Ionicons
                        name={isCurrent ? 'checkmark-circle' : 'happy-outline'}
                        size={20}
                        color={isCurrent ? colors.accent : colors.muted}
                      />
                      <Text style={styles.rowName} numberOfLines={1}>{item.name || '宝宝'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        {item.gender && (
                          <Text style={styles.rowTag}>
                            {item.gender === 'boy' ? '男宝' : item.gender === 'girl' ? '女宝' : ''}
                          </Text>
                        )}
                        {(() => {
                          const info = getBabyWeekLabel(item);
                          if (!info) return null;
                          const typeStyle = info.type === 'postpartum'
                            ? styles.rowWeekPostpartum
                            : info.type === 'preconception'
                              ? styles.rowWeekPreconception
                              : styles.rowWeekPregnant;
                          return <Text style={[styles.rowWeek, typeStyle]}>{info.text}</Text>;
                        })()}
                      </View>
                    </Pressable>
                    {/* 编辑姓名按钮 */}
                    <Pressable
                      style={styles.editBtn}
                      onPress={() => startEditing(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="pencil-outline" size={14} color={colors.muted} />
                    </Pressable>
                  </View>
                );
              }}
            />

            <View style={styles.divider} />

            <Pressable
              onPress={() => { setOpen(false); router.push('/baby-info?mode=new'); }}
              style={styles.actionRow}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.actionText}>新增宝宝</Text>
            </Pressable>

            <Pressable
              onPress={() => { setOpen(false); router.push('/(tabs)/profile'); }}
              style={styles.actionRow}
            >
              <Ionicons name="settings-outline" size={20} color={colors.muted} />
              <Text style={[styles.actionText, { color: colors.muted }]}>宝宝管理</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 编辑姓名弹窗 */}
      <Modal visible={!!editingBaby} transparent animationType="fade" onRequestClose={() => setEditingBaby(null)}>
        <Pressable style={styles.editOverlay} onPress={() => !saving && setEditingBaby(null)}>
          <Pressable style={styles.editSheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.editTitle}>修改姓名</Text>
            <Text style={styles.editHint}>给宝宝改个名字吧，修改后将同步更新到所有页面</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="输入宝宝姓名"
              placeholderTextColor={colors.muted}
              autoFocus
              editable={!saving}
            />
            <View style={styles.editActions}>
              <Pressable
                style={styles.editCancel}
                onPress={() => setEditingBaby(null)}
                disabled={saving}
              >
                <Text style={styles.editCancelText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.editSave, (!editName.trim() || saving) && styles.editSaveDisabled]}
                onPress={handleSaveName}
                disabled={!editName.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.editSaveText}>保存</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 切换宝宝 Loading */}
      <Modal visible={switching} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>正在切换宝宝…</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default BabySwitcher;
