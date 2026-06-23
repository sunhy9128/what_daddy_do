import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { loadChildCheckupRecords, saveChildCheckupRecords, ChildCheckupRecord } from '../../lib/storage';
import { getWellChildVisits, getAllCheckupItems } from '../../lib/api';
import { WellChildVisit, WellChildCheckupItem } from '../../lib/supabase';
import { LoadingDot } from './ToolBase';

// ─── 工具函数 ───
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  measurement: '体格测量',
  physical_exam: '体格检查',
  development: '发育评估',
  lab_test: '实验室检查',
  screening: '专项筛查',
  vaccination_check: '疫苗接种',
  guidance: '指导',
  oral_health: '口腔保健',
};

// ─── 组件 ───
export function ChildCheckupTool({ userId, expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { state } = useApp();

  // DB 参考数据
  const [visits, setVisits] = useState<WellChildVisit[]>([]);
  const [checkupItems, setCheckupItems] = useState<WellChildCheckupItem[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // 用户记录（AsyncStorage 本地）
  const [records, setRecords] = useState<ChildCheckupRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  // UI 状态
  const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<ChildCheckupRecord>>({});
  const [showCompleted, setShowCompleted] = useState(true);
  // 每个节点展开/折叠状态（默认仅第一个未进行的展开）
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // ─── 加载 DB 参考数据 ───
  useEffect(() => {
    (async () => {
      try {
        const [v, items] = await Promise.all([
          getWellChildVisits(),
          getAllCheckupItems(),
        ]);
        setVisits(v);
        setCheckupItems(items);
      } catch (e) {
        console.error('加载儿保参考数据失败:', e);
        setDbError('网络异常，无法加载儿保检查项目');
      } finally {
        setDbLoading(false);
      }
    })();
  }, []);

  // ─── 加载用户记录 ───
  useEffect(() => {
    if (!userId) { setRecordsLoading(false); return; }
    (async () => {
      try {
        const data = await loadChildCheckupRecords(userId, state.currentBabyId!);
        setRecords(data);
      } catch (e) {
        console.error('loadChildCheckupRecords error:', e);
      } finally {
        setRecordsLoading(false);
      }
    })();
  }, [userId]);

  // ─── 数据就绪后，自动展开第一个未进行的节点 ───
  useEffect(() => {
    if (visits.length === 0 || dbLoading) return;
    const firstPending = visits.find(v => !getRecord(v.id));
    if (firstPending && !expandedCards.has(firstPending.id)) {
      setExpandedCards(new Set([firstPending.id]));
    }
  }, [visits, records, dbLoading]);

  const persist = useCallback((data: ChildCheckupRecord[]) => {
    setRecords(data);
    saveChildCheckupRecords(userId, state.currentBabyId!, data);
  }, [userId, state.currentBabyId]);

  const getRecord = useCallback((visitId: number) =>
    records.find(r => r.visitId === visitId),
    [records]
  );

  const getItemsForVisit = useCallback((visitId: number) =>
    checkupItems.filter(i => i.visit_id === visitId),
    [checkupItems]
  );

  // ─── 表单操作 ───
  const handleStartEdit = (visitId: number) => {
    const existing = getRecord(visitId);
    setEditingVisitId(visitId);
    setFormData(existing ? { ...existing } : {
      date: getTodayStr(),
      weight: undefined,
      height: undefined,
      headCircumference: undefined,
      hemoglobin: undefined,
      visionLeft: undefined,
      visionRight: undefined,
      milestones: '',
      notes: '',
    });
  };

  const handleSave = () => {
    if (editingVisitId === null || !formData.date) return;
    const existing = records.find(r => r.visitId === editingVisitId);
    let newRecords: ChildCheckupRecord[];
    if (existing) {
      newRecords = records.map(r =>
        r.visitId === editingVisitId
          ? { ...r, ...formData, id: r.id, visitId: editingVisitId, createdAt: new Date().toISOString() }
          : r
      );
    } else {
      const record: ChildCheckupRecord = {
        id: generateId(),
        visitId: editingVisitId,
        date: formData.date || getTodayStr(),
        weight: formData.weight,
        height: formData.height,
        headCircumference: formData.headCircumference,
        hemoglobin: formData.hemoglobin,
        visionLeft: formData.visionLeft,
        visionRight: formData.visionRight,
        milestones: formData.milestones || '',
        notes: formData.notes || '',
        createdAt: new Date().toISOString(),
      };
      newRecords = [...records, record];
    }
    persist(newRecords);
    setEditingVisitId(null);
    setFormData({});
  };

  const handleDelete = (visitId: number) => {
    persist(records.filter(r => r.visitId !== visitId));
  };

  const toggleCard = (visitId: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(visitId)) next.delete(visitId);
      else next.add(visitId);
      return next;
    });
  };

  // ─── 派生数据 ───
  const completedCount = records.length;
  const totalCount = visits.length;
  const displayVisits = showCompleted
    ? visits
    : visits.filter(v => !getRecord(v.id));

  // ─── 样式 ───
  const styles = useMemo(() => StyleSheet.create({
    container: {},
    scrollContainer: { maxHeight: expanded ? undefined : 440 },

    // 进度概览
    overview: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.sm, paddingBottom: spacing.md,
      gap: spacing.md,
    },
    progressCircle: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center', justifyContent: 'center',
    },
    progressCircleInner: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    progressNumber: {
      ...typography.headline, fontWeight: '700', color: colors.accent,
    },
    progressDiv: {
      ...typography.caption1, color: colors.muted,
    },
    overviewInfo: { flex: 1 },
    overviewTitle: {
      ...typography.callout, fontWeight: '600', color: colors.fg,
    },
    overviewDesc: {
      ...typography.caption1, color: colors.muted, marginTop: 2,
    },
    filterBtn: {
      paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    filterBtnActive: {
      backgroundColor: colors.accentLight, borderColor: colors.accent,
    },
    filterText: {
      ...typography.caption2, color: colors.muted,
    },
    filterTextActive: {
      color: colors.accent, fontWeight: '600',
    },

    // 时间线
    timelineWrapper: { paddingLeft: 8 },

    card: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    timelineGutter: {
      width: 32, alignItems: 'center',
    },
    timelineDot: {
      width: 14, height: 14, borderRadius: 7,
      borderWidth: 3,
      marginTop: 16,
      zIndex: 1,
    },
    cardBody: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginLeft: spacing.sm,
      marginBottom: spacing.xs,
      ...shadows.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardInfo: { flex: 1 },
    cardLabel: {
      ...typography.callout, fontWeight: '700', color: colors.fg,
    },
    cardAge: {
      ...typography.caption2, color: colors.muted, marginTop: 1,
    },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderRadius: radius.full,
    },
    badgeDone: { backgroundColor: colors.success + '16' },
    badgePending: { backgroundColor: colors.accent + '14' },
    statusText: { ...typography.caption2, fontWeight: '600' },
    statusTextDone: { color: colors.success },
    statusTextPending: { color: colors.accent },

    // 检查项清单（仅 expanded 时展开）
    checklist: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    checklistTitle: {
      ...typography.caption1, fontWeight: '600', color: colors.fgSecondary,
      marginBottom: spacing.sm,
    },
    checklistItem: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: 4,
    },
    checklistDot: {
      width: 5, height: 5, borderRadius: 2.5,
      backgroundColor: colors.muted,
      marginTop: 6,
    },
    checklistName: {
      ...typography.footnote, color: colors.fg, flex: 1, lineHeight: 18,
    },
    checklistNote: {
      ...typography.caption2, color: colors.muted, marginTop: 1,
    },
    checklistCategory: {
      ...typography.caption2, color: colors.info, fontSize: 10,
      fontWeight: '600', marginTop: 1,
    },
    keyTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: colors.accent + '10',
      marginTop: 4,
    },
    keyTagText: {
      ...typography.caption2, fontSize: 10, color: colors.accent, fontWeight: '600',
    },

    // 指标标签
    metricsRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
      marginTop: spacing.sm,
    },
    metricItem: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      minWidth: 52,
    },
    metricLabel: {
      ...typography.caption2, color: colors.muted, fontSize: 9,
    },
    metricValue: {
      ...typography.caption1, fontWeight: '600', color: colors.fg,
    },

    // 操作
    actionRow: {
      flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm,
    },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
      borderRadius: radius.full, borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accent + '14',
    },
    actionBtnText: {
      ...typography.caption2, fontWeight: '600', color: colors.accent,
    },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
      borderRadius: radius.full, borderWidth: 1,
      borderColor: colors.error + '40',
      backgroundColor: colors.error + '10',
    },
    deleteBtnText: {
      ...typography.caption2, fontWeight: '600', color: colors.error,
    },

    // 空状态
    empty: {
      alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm,
    },
    emptyIcon: { marginBottom: spacing.xs },
    emptyText: {
      ...typography.callout, color: colors.muted, textAlign: 'center',
    },
    errorText: {
      ...typography.callout, color: colors.error, textAlign: 'center',
    },

    // ─── Modal ───
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      width: '100%', maxWidth: 380,
      maxHeight: '85%',
    },
    modalScroll: {},
    modalTitle: {
      ...typography.title3, fontWeight: '700', color: colors.fg,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.caption1, fontWeight: '600', color: colors.accent,
      marginBottom: spacing.sm, marginTop: spacing.sm,
    },
    formRow: { marginBottom: spacing.md },
    formLabel: {
      ...typography.caption1, fontWeight: '600', color: colors.fgSecondary,
      marginBottom: spacing.xs,
    },
    formInput: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1, borderColor: colors.border,
    },
    formTextarea: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1, borderColor: colors.border,
      minHeight: 72, textAlignVertical: 'top',
    },
    formRow3: {
      flexDirection: 'row', gap: spacing.sm,
    },
    formCol: { flex: 1 },
    modalActions: {
      flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm,
      marginTop: spacing.lg, paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    cancelBtn: {
      paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
    },
    cancelBtnText: {
      ...typography.callout, color: colors.muted,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
    },
    saveBtnText: {
      ...typography.callout, fontWeight: '600', color: '#fff',
    },

    keyNote: {
      marginTop: spacing.md,
      padding: spacing.sm,
      backgroundColor: colors.accentLight,
      borderRadius: radius.sm,
      flexDirection: 'row', gap: spacing.sm,
    },
    keyNoteText: {
      ...typography.caption2, color: colors.accent, flex: 1,
      lineHeight: 16,
    },
    expandHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: spacing.sm,
    },
    expandHintText: {
      ...typography.caption2, color: colors.muted,
    },
  }), [colors]);

  // ─── 加载中 ───
  if (dbLoading || recordsLoading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
        <LoadingDot />
      </View>
    );
  }

  // ─── 网络错误（参考数据加载失败） ───
  if (dbError || visits.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cloud-offline-outline" size={36} color={colors.muted} />
        <Text style={styles.errorText}>{dbError || '暂无儿保数据'}</Text>
      </View>
    );
  }

  // ─── VisitCard 子组件 ───
  const editingVisit = editingVisitId ? visits.find(v => v.id === editingVisitId) : null;

  return (
    <View style={styles.container}>
      {/* 进度概览 */}
      <View style={styles.overview}>
        <View style={styles.progressCircle}>
          <View style={styles.progressCircleInner}>
            <Text style={styles.progressNumber}>{completedCount}</Text>
          </View>
        </View>
        <View style={styles.overviewInfo}>
          <Text style={styles.overviewTitle}>儿保记录</Text>
          <Text style={styles.overviewDesc}>
            已完成 {completedCount}/{totalCount} 次 · 共 {totalCount} 次标准访视
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, !showCompleted && styles.filterBtnActive]}
          onPress={() => setShowCompleted(!showCompleted)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showCompleted ? 'eye-outline' : 'eye-off-outline'}
            size={14}
            color={showCompleted ? colors.muted : colors.accent}
          />
          <Text style={[styles.filterText, !showCompleted && styles.filterTextActive]}>
            {showCompleted ? '全部' : '待检'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 时间轴列表 */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.timelineWrapper}>
          {displayVisits.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={40} color={colors.success} />
              <Text style={styles.emptyText}>所有儿保都已记录 <Ionicons name="checkmark-circle" size={14} color={colors.success} /></Text>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setShowCompleted(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, { color: colors.accent }]}>查看全部</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayVisits.map((visit, idx) => {
              const record = getRecord(visit.id);
              const isDone = !!record;
              const items = getItemsForVisit(visit.id);

              return (
                <React.Fragment key={visit.slug}>
                  <View style={styles.card}>
                    {/* 时间轴左侧 */}
                    <View style={styles.timelineGutter}>
                      <View style={[styles.timelineDot, {
                        borderColor: isDone ? colors.success : colors.accent,
                        backgroundColor: isDone ? colors.success : colors.surface,
                      }]} />
                    </View>

                    {/* 卡片主体 */}
                    <View style={styles.cardBody}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleCard(visit.id)}
                        style={styles.cardHeader}
                      >
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardLabel}>{visit.name}</Text>
                          <Text style={styles.cardAge}>{visit.age_label}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <View style={[styles.statusBadge, isDone ? styles.badgeDone : styles.badgePending]}>
                            <Ionicons
                              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                              size={12}
                              color={isDone ? colors.success : colors.accent}
                            />
                            <Text style={[styles.statusText, isDone ? styles.statusTextDone : styles.statusTextPending]}>
                              {isDone ? '已完成' : '待检查'}
                            </Text>
                          </View>
                          <Ionicons
                            name={expandedCards.has(visit.id) ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={colors.muted}
                          />
                        </View>
                      </TouchableOpacity>

                      {expandedCards.has(visit.id) && (<>
                      {visit.is_key_visit && !isDone && (
                        <View style={styles.keyTag}>
                          <Text style={styles.keyTagText}>关键节点 · 含血检/筛查</Text>
                        </View>
                      )}

                      {isDone && record && (
                        <View style={styles.metricsRow}>
                          {record.weight && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>体重</Text>
                              <Text style={styles.metricValue}>{record.weight} kg</Text>
                            </View>
                          )}
                          {record.height && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>身长</Text>
                              <Text style={styles.metricValue}>{record.height} cm</Text>
                            </View>
                          )}
                          {record.headCircumference && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>头围</Text>
                              <Text style={styles.metricValue}>{record.headCircumference} cm</Text>
                            </View>
                          )}
                          {record.hemoglobin && (
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>血红蛋白</Text>
                              <Text style={styles.metricValue}>{record.hemoglobin} g/L</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* 展开检查项清单 */}
                      {items.length > 0 && (
                        <View style={styles.checklist}>
                          <Text style={styles.checklistTitle}>
                            标准检查项目（{items.length} 项）
                          </Text>
                          {items.map(item => (
                            <View key={item.id} style={styles.checklistItem}>
                              <View style={styles.checklistDot} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.checklistName}>{item.name}</Text>
                                {item.description && (
                                  <Text style={styles.checklistNote}>{item.description}</Text>
                                )}
                                <Text style={styles.checklistCategory}>
                                  {CATEGORY_LABELS[item.category] || item.category}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {isDone && record && (record.milestones || record.notes) && (
                        <Text style={{
                          ...typography.footnote, color: colors.fgSecondary,
                          marginTop: spacing.sm, lineHeight: 18,
                          paddingTop: spacing.sm,
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.divider,
                        }}>
                          {record.milestones ? `发育: ${record.milestones}` : ''}
                          {record.notes ? `\n备注: ${record.notes}` : ''}
                        </Text>
                      )}

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => { handleStartEdit(visit.id); }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={isDone ? 'create-outline' : 'add'} size={13} color={colors.accent} />
                          <Text style={styles.actionBtnText}>{isDone ? '编辑' : '记录'}</Text>
                        </TouchableOpacity>
                        {isDone && (
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(visit.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={13} color={colors.error} />
                            <Text style={styles.deleteBtnText}>删除</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      </>)}
                    </View>
                  </View>
                </React.Fragment>
              );
            })
          )}
        </View>

        {expanded && (
          <View style={styles.keyNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} style={{ marginTop: 1 }} />
            <Text style={styles.keyNoteText}>
              数据来源：国家卫健委《0-6岁儿童健康管理服务规范》+ 小红书儿保高频帖子共识交叉验证。共 {totalCount} 次标准访视，6月龄、1岁、3岁、6岁为关键节点（含血常规和专项筛查）。
            </Text>
          </View>
        )}

        {!expanded && completedCount > 0 && completedCount < totalCount && (
          <View style={styles.expandHint}>
            <Ionicons name="chevron-down" size={12} color={colors.muted} />
            <Text style={styles.expandHintText}>滚动查看更多</Text>
          </View>
        )}
      </ScrollView>

      {/* ─── 记录/编辑 Modal ─── */}
      <Modal visible={editingVisitId !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingVisit?.name || ''} — 记录详情
              </Text>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>检查日期</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.date || getTodayStr()}
                  onChangeText={t => setFormData(d => ({ ...d, date: t }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <Text style={styles.sectionTitle}>体格测量</Text>

              <View style={styles.formRow3}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>体重 (kg)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.weight?.toString() || ''}
                    onChangeText={t => setFormData(d => ({ ...d, weight: t ? parseFloat(t) : undefined }))}
                    placeholder="如 7.5"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>身长 (cm)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.height?.toString() || ''}
                    onChangeText={t => setFormData(d => ({ ...d, height: t ? parseFloat(t) : undefined }))}
                    placeholder="如 68"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>头围 (cm)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.headCircumference?.toString() || ''}
                    onChangeText={t => setFormData(d => ({ ...d, headCircumference: t ? parseFloat(t) : undefined }))}
                    placeholder="如 42"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.sectionTitle}>实验室检查</Text>

              <View style={styles.formRow3}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>血红蛋白 (g/L)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.hemoglobin?.toString() || ''}
                    onChangeText={t => setFormData(d => ({ ...d, hemoglobin: t ? parseFloat(t) : undefined }))}
                    placeholder="如 120"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>左眼视力</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.visionLeft?.toString() || ''}
                    onChangeText={t => setFormData(d => ({ ...d, visionLeft: t ? parseFloat(t) : undefined }))}
                    placeholder="如 1.0"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>右眼视力</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.visionRight?.toString() || ''}
                    onChangeText={t => setFormData(d => ({ ...d, visionRight: t ? parseFloat(t) : undefined }))}
                    placeholder="如 1.0"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.sectionTitle}>发育评估</Text>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>发育里程碑</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.milestones}
                  onChangeText={t => setFormData(d => ({ ...d, milestones: t }))}
                  placeholder="大运动、精细动作、语言、社交等情况"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>备注 / 医生建议</Text>
                <TextInput
                  style={styles.formTextarea}
                  value={formData.notes}
                  onChangeText={t => setFormData(d => ({ ...d, notes: t }))}
                  placeholder="异常情况、医生建议、下次复查提醒..."
                  placeholderTextColor={colors.muted}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setEditingVisitId(null); setFormData({}); }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default ChildCheckupTool;
