import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import {
  loadSleepRecords, saveSleepRecords, BabySleepRecord,
} from '../../lib/storage';
import { useApp } from '../../context/AppContext';

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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

const QUALITY_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  good: { label: '睡得香', icon: 'happy-outline', color: '#34C759' },
  fair: { label: '还行', icon: 'remove-outline', color: '#FF9F0A' },
  poor: { label: '不安稳', icon: 'sad-outline', color: '#FF3B30' },
};

export function BabySleepLog({ userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const { state } = useApp();
  const [records, setRecords] = useState<BabySleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStart, setTimerStart] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formQuality, setFormQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [formNotes, setFormNotes] = useState('');
  const [formStartTime, setFormStartTime] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const todayStr = getTodayStr();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const all = await loadSleepRecords(userId, state.currentBabyId!);
        setRecords(all);
        // 检查是否有未结束的记录
        const ongoing = all.find(r => r.date === todayStr && r.endTime === null);
        if (ongoing) {
          setTimerActive(true);
          setTimerStart(ongoing.startTime);
        }
      } catch (e) {
        console.error('loadSleepRecords error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // 计时器更新
  useEffect(() => {
    if (!timerActive || !timerStart) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(timerStart).getTime()) / 1000);
      setElapsed(diff >= 0 ? diff : 0);
    };
    calc();
    timerRef.current = setInterval(calc, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timerStart]);

  const persistRecords = useCallback((newRecords: BabySleepRecord[]) => {
    if (!userId) return;
    setRecords(newRecords);
    saveSleepRecords(userId, state.currentBabyId!, newRecords);
  }, [userId, state]);

  // 今日记录
  const todayRecords = useMemo(() => {
    return records.filter(r => r.date === todayStr && r.endTime !== null)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [records, todayStr]);

  const todayTotalSleep = useMemo(() => {
    return todayRecords.reduce((sum, r) => sum + r.durationSec, 0);
  }, [todayRecords]);

  const todaySleepCount = todayRecords.length;

  const handleStartSleep = () => {
    const now = new Date().toISOString();
    const newRecord: BabySleepRecord = {
      id: generateId(),
      startTime: now,
      endTime: null,
      date: todayStr,
      durationSec: 0,
      quality: 'good',
      notes: '',
    };
    setTimerActive(true);
    setTimerStart(now);
    setElapsed(0);
    persistRecords([newRecord, ...records]);
  };

  const handleStopSleep = () => {
    if (!timerStart) return;
    const now = new Date().toISOString();
    const duration = Math.floor((Date.now() - new Date(timerStart).getTime()) / 1000);
    setTimerActive(false);
    setTimerStart(null);
    setElapsed(0);
    setFormStartTime(timerStart);
    setFormQuality('good');
    setFormNotes('');
    setShowForm(true);

    // 先创建一个临时记录
    const updated = records.map(r => {
      if (r.endTime === null && r.date === todayStr) {
        return { ...r, endTime: now, durationSec: duration };
      }
      return r;
    });
    persistRecords(updated);
  };

  const handleSaveQuality = () => {
    if (!formStartTime) return;
    const updated = records.map(r => {
      if (r.startTime === formStartTime && r.date === todayStr) {
        return { ...r, quality: formQuality, notes: formNotes };
      }
      return r;
    });
    persistRecords(updated);
    setShowForm(false);
    setFormStartTime(null);
    setFormNotes('');
  };

  const handleDeleteRecord = (recordId: string) => {
    const msg = '确定删除这条睡眠记录吗？';
    const doDelete = () => {
      const filtered = records.filter(r => r.id !== recordId);
      persistRecords(filtered);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doDelete();
    } else {
      Alert.alert('删除记录', msg, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { gap: spacing.md },
    // 计时器
    timerCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    timerLabel: {
      ...typography.footnote,
      color: colors.fgSecondary,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    timerDisplay: {
      ...typography.title1,
      fontWeight: '700',
      color: colors.accent,
      fontSize: 36,
      fontVariant: ['tabular-nums'],
    },
    timerBtnRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    timerBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerBtnStart: {
      backgroundColor: colors.accent,
    },
    timerBtnStop: {
      backgroundColor: colors.error,
    },
    timerBtnText: {
      ...typography.footnote,
      fontWeight: '700',
      color: '#fff',
      marginTop: 2,
    },
    // 今日汇总
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    summaryValue: {
      ...typography.title2,
      fontWeight: '700',
      color: colors.accent,
    },
    summaryLabel: {
      ...typography.caption2,
      color: colors.muted,
    },
    // 记录列表
    sectionTitle: {
      ...typography.callout,
      fontWeight: '600',
      color: colors.fg,
      marginBottom: spacing.sm,
    },
    recordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 0.5,
      borderColor: colors.border,
      gap: spacing.md,
    },
    recordInfo: {
      flex: 1,
    },
    recordTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    recordDuration: {
      ...typography.callout,
      fontWeight: '600',
      color: colors.fg,
    },
    recordTimeLabel: {
      ...typography.caption2,
      color: colors.muted,
    },
    recordNote: {
      ...typography.footnote,
      color: colors.fgSecondary,
      marginTop: 2,
    },
    qualityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    qualityText: {
      ...typography.caption2,
      fontWeight: '600',
    },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    emptyText: {
      ...typography.footnote,
      color: colors.muted,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    loadingText: { ...typography.footnote, color: colors.fgSecondary },
    // 质量评价表单
    formOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    formContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 400,
    },
    formTitle: {
      ...typography.title3,
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    qualityRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    qualityOption: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    qualityOptionActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    notesInput: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      padding: spacing.md,
      minHeight: 60,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    formCancel: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
    },
    formCancelText: {
      ...typography.callout,
      color: colors.muted,
    },
    formSave: {
      backgroundColor: colors.accent,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
    },
    formSaveText: {
      ...typography.callout,
      fontWeight: '600',
      color: '#fff',
    },
  }), [colors]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 计时器卡片 */}
      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>
          {timerActive ? '正在睡觉…' : '点击开始记录宝宝睡觉'}
        </Text>
        <Text style={styles.timerDisplay}>
          {timerActive
            ? `${String(Math.floor(elapsed / 3600)).padStart(2, '0')}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
            : '--:--:--'}
        </Text>
        <View style={styles.timerBtnRow}>
          {!timerActive ? (
            <TouchableOpacity style={[styles.timerBtn, styles.timerBtnStart]} onPress={handleStartSleep} activeOpacity={0.75}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.timerBtnText}>开始</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.timerBtn, styles.timerBtnStop]} onPress={handleStopSleep} activeOpacity={0.75}>
              <Ionicons name="stop" size={24} color="#fff" />
              <Text style={styles.timerBtnText}>停止</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 今日汇总 */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatDuration(todayTotalSleep)}</Text>
          <Text style={styles.summaryLabel}>今日睡眠</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{todaySleepCount}</Text>
          <Text style={styles.summaryLabel}>睡眠次数</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {todaySleepCount > 0 ? formatDuration(Math.round(todayTotalSleep / todaySleepCount)) : '--'}
          </Text>
          <Text style={styles.summaryLabel}>平均时长</Text>
        </View>
      </View>

      {/* 今日记录列表 */}
      <Text style={styles.sectionTitle}>今日睡眠记录</Text>
      {todayRecords.length > 0 ? (
        <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
          {todayRecords.map(r => {
            const qc = QUALITY_CONFIG[r.quality] || QUALITY_CONFIG.good;
            return (
              <View key={r.id} style={styles.recordItem}>
                <Ionicons name="moon-outline" size={20} color={colors.accent} />
                <View style={styles.recordInfo}>
                  <View style={styles.recordTimeRow}>
                    <Text style={styles.recordDuration}>{formatDuration(r.durationSec)}</Text>
                    <Text style={styles.recordTimeLabel}>
                      {formatTime(r.startTime)} — {formatTime(r.endTime || '')}
                    </Text>
                  </View>
                  {r.notes ? (
                    <Text style={styles.recordNote} numberOfLines={1}>{r.notes}</Text>
                  ) : null}
                </View>
                <View style={[styles.qualityBadge, { backgroundColor: qc.color + '20' }]}>
                  <Ionicons name={qc.icon} size={12} color={qc.color} />
                  <Text style={[styles.qualityText, { color: qc.color }]}>{qc.label}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRecord(r.id)} activeOpacity={0.6}>
                  <Ionicons name="trash-outline" size={14} color={colors.muted} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="moon-outline" size={24} color={colors.muted} />
          <Text style={styles.emptyText}>暂无睡眠记录</Text>
        </View>
      )}

      {/* 质量评价弹窗 */}
      {showForm && (
        <View style={styles.formOverlay}>
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>这次睡得怎么样？</Text>
            <View style={styles.qualityRow}>
              {Object.entries(QUALITY_CONFIG).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.qualityOption, formQuality === key && styles.qualityOptionActive]}
                  onPress={() => setFormQuality(key as 'good' | 'fair' | 'poor')}
                  activeOpacity={0.7}
                >
                  <Ionicons name={cfg.icon} size={24} color={formQuality === key ? colors.accent : colors.muted} />
                  <Text style={{ ...typography.caption1, fontWeight: '500', color: formQuality === key ? colors.accent : colors.fgSecondary }}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="备注（可选）"
              placeholderTextColor={colors.muted}
              value={formNotes}
              onChangeText={setFormNotes}
              multiline
            />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.formCancel} onPress={() => setShowForm(false)}>
                <Text style={styles.formCancelText}>跳过</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formSave} onPress={handleSaveQuality} activeOpacity={0.7}>
                <Text style={styles.formSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default BabySleepLog;
