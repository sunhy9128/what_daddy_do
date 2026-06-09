import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { loadContractionRecords, saveContractionRecords, ContractionRecord } from '../../lib/storage';
import { LoadingDot } from './ToolBase';

export function ContractionTimer({ userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const [records, setRecords] = useState<ContractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timing, setTiming] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  // Load today's records
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const all = await loadContractionRecords(userId);
        setRecords(all.filter(r => r.date === todayStr).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      } catch (e) {
        console.error('Failed to load contraction records:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persistRecords = useCallback((newRecords: ContractionRecord[]) => {
    if (!userId) return;
    saveContractionRecords(userId, newRecords);
  }, [userId]);

  // 计时器更新
  useEffect(() => {
    if (!timing) { setElapsed(0); return; }
    const start = new Date(startTimeRef.current!).getTime();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timing]);

  const handleStart = () => {
    startTimeRef.current = new Date().toISOString();
    setTiming(true);
  };

  const handleStop = () => {
    if (!startTimeRef.current) return;
    const endTime = new Date().toISOString();
    const startMs = new Date(startTimeRef.current).getTime();
    const duration = Math.round((new Date(endTime).getTime() - startMs) / 1000);

    // 计算距上次宫缩的间隔
    const lastRecord = records.length > 0 ? records[0] : null;
    let interval = 0;
    if (lastRecord) {
      interval = Math.round((startMs - new Date(lastRecord.startTime).getTime()) / 1000);
    }

    const newRecord: ContractionRecord = {
      id: Date.now(),
      startTime: startTimeRef.current,
      endTime,
      duration,
      interval,
      date: todayStr,
    };

    const newRecords = [newRecord, ...records];
    setRecords(newRecords);
    persistRecords(newRecords);
    startTimeRef.current = null;
    setTiming(false);
  };

  const handleClear = () => {
    if (records.length === 0) return;
    const msg = `确定清除今日 ${records.length} 条宫缩记录吗？`;
    const doClear = () => {
      setRecords([]);
      persistRecords([]);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doClear();
    } else {
      Alert.alert('清除记录', msg, [
        { text: '取消', style: 'cancel' },
        { text: '清除', style: 'destructive', onPress: doClear },
      ]);
    }
  };

  const formatElapsed = (sec: number) => {
    if (sec < 60) return `${sec}秒`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}分${s}秒` : `${m}分钟`;
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  const styles = useMemo(() => StyleSheet.create({
    container: { gap: spacing.lg },
    timerSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.accentLight,
      borderRadius: radius.md,
    },
    timerBtn: {
      width: 72, height: 72,
      borderRadius: radius.full,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    timerBtnActive: { backgroundColor: colors.error },
    timerBtnIdle: { backgroundColor: colors.accent },
    timerLabel: { ...typography.caption1, color: colors.fgSecondary, fontWeight: '500' },
    elapsedText: {
      ...typography.title1,
      fontWeight: '700',
      color: colors.fg,
      marginTop: spacing.xs,
    },
    hint: {
      ...typography.caption2,
      color: colors.fgSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 16,
    },
    recordSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...shadows.sm,
    },
    recordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    recordTitle: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.fgSecondary,
    },
    clearBtn: { ...typography.caption2, color: colors.error, fontWeight: '600' },
    recordList: { height: 160 },
    recordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    recordItemLast: { borderBottomWidth: 0 },
    recordTime: { ...typography.footnote, color: colors.fgSecondary, width: 64 },
    recordDuration: { ...typography.callout, fontWeight: '600', color: colors.fg, flex: 1 },
    recordInterval: { ...typography.footnote, color: colors.muted },
    emptyState: {
      height: 154,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    emptyText: { ...typography.footnote, color: colors.muted, fontWeight: '500' },
    loadingContainer: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
    loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    loadingText: { ...typography.footnote, color: colors.fgSecondary },
  }), [colors]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={150} />
            <LoadingDot delay={300} />
          </View>
          <Text style={styles.loadingText}>加载中…</Text>
        </View>
      ) : (
        <>
          {/* 计时器 */}
          <View style={styles.timerSection}>
            <TouchableOpacity
              style={[styles.timerBtn, timing ? styles.timerBtnActive : styles.timerBtnIdle]}
              onPress={timing ? handleStop : handleStart}
              activeOpacity={0.75}
            >
              <Ionicons
                name={timing ? 'stop' : 'play'}
                size={36}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.timerLabel}>
              {timing ? '正在计时，点击停止' : '点击开始记录宫缩'}
            </Text>
            <Text style={styles.elapsedText}>{timing ? formatElapsed(elapsed) : '0秒'}</Text>
            <Text style={styles.hint}>
              记录宫缩的开始和持续时间，帮助判断产程进展
            </Text>
          </View>

          {/* 记录列表 */}
          <View style={styles.recordSection}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>{dateStr} · {records.length}次</Text>
              {records.length > 0 ? (
                <TouchableOpacity onPress={handleClear}><Text style={styles.clearBtn}>清除</Text></TouchableOpacity>
              ) : (
                <View style={{ width: 32 }} />
              )}
            </View>
            {records.length > 0 ? (
              <ScrollView style={styles.recordList} showsVerticalScrollIndicator={false}>
                {records.map((r, idx) => (
                  <View key={r.id} style={[styles.recordItem, idx === records.length - 1 && styles.recordItemLast]}>
                    <Text style={styles.recordTime}>
                      {new Date(r.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.recordDuration}>{formatElapsed(r.duration)}</Text>
                    <Text style={styles.recordInterval}>
                      {idx < records.length - 1 ? `间隔 ${formatElapsed(r.interval)}` : ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={20} color={colors.muted} style={{ marginBottom: 4 }} />
                <Text style={styles.emptyText}>还没有宫缩记录</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

export default ContractionTimer;
