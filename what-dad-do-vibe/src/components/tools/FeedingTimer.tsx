import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';
import { loadFeedingRecords, saveFeedingRecords, FeedingRecordData } from '../../lib/storage';
import { LoadingDot } from './ToolBase';

interface FeedingRecord {
  id: number;
  time: string;
}

export function FeedingTimer({ userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const nextId = useRef(1);
  const todayStr = new Date().toISOString().split('T')[0];

  // 加载今日喂奶记录（同时初始化 allRecordsRef，供 persistRecords 读取其他日的数据）
  const allRecordsRef = useRef<FeedingRecordData[]>([]);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const all = await loadFeedingRecords(userId);
        allRecordsRef.current = all;
        const todaysRecords = all.filter(r => r.date === todayStr);
        setRecords(todaysRecords.map(r => ({ id: r.id, time: r.time })));
        const maxId = todaysRecords.reduce((max, r) => Math.max(max, r.id), 0);
        nextId.current = maxId + 1;
      } catch (e) {
        console.error('Failed to load feeding records:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persistRecords = (newRecords: FeedingRecord[]) => {
    if (!userId) return;
    const otherDays = allRecordsRef.current.filter(r => r.date !== todayStr);
    const todaysRecords: FeedingRecordData[] = newRecords.map(r => ({
      id: r.id, time: r.time, date: todayStr,
    }));
    const merged = [...otherDays, ...todaysRecords];
    allRecordsRef.current = merged;
    saveFeedingRecords(userId, merged);
  };

  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // 距离上次喂奶的分钟数
  const [elapsedMin, setElapsedMin] = useState<number | null>(null);
  useEffect(() => {
    const calc = () => {
      if (records.length === 0) { setElapsedMin(null); return; }
      const last = records[0].time; // HH:MM
      const [h, m] = last.split(':').map(Number);
      const now = new Date();
      const lastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      const diff = Math.floor((now.getTime() - lastDate.getTime()) / 60000);
      setElapsedMin(diff >= 0 ? diff : 0);
    };
    calc();
    const timer = setInterval(calc, 120000);
    return () => clearInterval(timer);
  }, [records]);

  const handleFeed = () => {
    const record: FeedingRecord = {
      id: nextId.current++,
      time: formatTime(new Date()),
    };
    const newRecords = [record, ...records];
    setRecords(newRecords);
    persistRecords(newRecords);
  };

  const handleClear = () => {
    if (records.length === 0) return;
    const count = records.length;
    const msg = `确定清除今日 ${count} 条喂奶记录吗？此操作不可撤销。`;
    const doClear = () => {
      setRecords([]);
      persistRecords([]);
      nextId.current = 1;
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

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    mainArea: {
      flex: 1,
    },
    topRow: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    mainBtn: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    recordSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    recordHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    dateLabel: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.muted,
    },
    btnInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnElapsed: {
      ...typography.caption2,
      color: '#fff',
      fontWeight: '600',
      fontSize: 10,
      marginTop: 2,
    },
    clearBtnText: {
      ...typography.caption2,
      color: '#E53935',
      fontWeight: '600',
    },
    recordList: {
      maxHeight: 100,
    },
    recordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    recordTime: {
      ...typography.callout,
      fontWeight: '600',
      color: colors.fg,
      flex: 1,
    },
    recordIndex: {
      ...typography.caption2,
      color: colors.muted,
    },
    emptySection: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl + 4,
      backgroundColor: colors.accent + '12',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent + '25',
      borderStyle: 'dashed',
    },
    emptyText: {
      ...typography.footnote,
      color: colors.accent,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    loadingText: { ...typography.footnote, color: colors.muted },
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
          {/* 主体区域 */}
          <View style={styles.mainArea}>
            {/* 主按钮居中 */}
            <View style={styles.topRow}>
              <TouchableOpacity style={styles.mainBtn} onPress={handleFeed} activeOpacity={0.75}>
                <View style={styles.btnInner}>
                  {elapsedMin === null ? (
                    <Ionicons name="water-outline" size={30} color="#fff" />
                  ) : (
                    <Text style={[styles.btnElapsed, { fontSize: 12 }]}>
                      {elapsedMin < 1
                        ? '刚刚'
                        : elapsedMin < 60
                          ? `距上次\n${elapsedMin}分钟`
                          : `距上次\n${Math.floor(elapsedMin / 60)}小时${elapsedMin % 60}分钟`}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* 历史记录列表 */}
            {records.length > 0 ? (
              <View style={styles.recordSection}>
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.dateLabel}>{dateStr} · {records.length}次</Text>
                  <TouchableOpacity onPress={handleClear} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.clearBtnText}>清除</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.recordList} showsVerticalScrollIndicator={false}>
                  {records.map((r) => (
                    <View key={r.id} style={styles.recordItem}>
                      <Ionicons name="time-outline" size={14} color={colors.muted} style={{ marginRight: 6 }} />
                      <Text style={styles.recordTime}>{r.time}</Text>
                      <Text style={styles.recordIndex}>#{records.length - records.indexOf(r)}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="water-outline" size={20} color={colors.muted} style={{ marginBottom: 4 }} />
                <Text style={styles.emptyText}>点击图标记录喂奶</Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

export default FeedingTimer;
