import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import { loadFeedingRecords, saveFeedingRecords, FeedingRecordData } from '../../lib/storage';
import { LoadingDot } from './ToolBase';

interface FeedingRecord {
  id: number;
  time: string;
}

export function FeedingTimer({ userId }: { userId: string; babyGender?: string }) {
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
          {/* 左侧：大按钮 */}
          <View style={styles.leftCol}>
            <TouchableOpacity style={styles.mainBtn} onPress={handleFeed} activeOpacity={0.8}>
              <Text style={styles.mainBtnIcon}>🍼</Text>
              <Text style={styles.mainBtnText}>点击</Text>
            </TouchableOpacity>
            <Text style={styles.elapsedLabel}>
              {elapsedMin !== null ? `距上次 ${elapsedMin < 60 ? `${elapsedMin}分钟` : `${Math.floor(elapsedMin / 60)}小时${elapsedMin % 60}分钟`}` : '尚未喂奶'}
            </Text>
          </View>

          {/* 右侧：历史记录 */}
          <View style={styles.rightCol}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{dateStr}</Text>
              {records.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
                  <Text style={styles.clearBtnText}>清除</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.recordTable}>
              {records.length > 0 ? (
                <>
                  <View style={styles.recordHeader}>
                    <View style={[styles.recordHeaderCell, { flex: 1 }]}>
                      <Text style={styles.recordHeaderText}>序号</Text>
                    </View>
                    <View style={[styles.recordHeaderCell, { flex: 2 }]}>
                      <Text style={styles.recordHeaderText}>时间</Text>
                    </View>
                  </View>
                  <ScrollView style={styles.recordList} showsVerticalScrollIndicator={false}>
                    {records.map((r, i) => (
                      <View key={r.id} style={[styles.recordItem, i % 2 === 1 && styles.recordItemAlt]}>
                        <View style={[styles.recordCell, { flex: 1 }]}>
                          <Text style={styles.recordIndex}>#{records.length - i}</Text>
                        </View>
                        <View style={[styles.recordCell, { flex: 2 }]}>
                          <Text style={styles.recordTime}>{r.time}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <View style={styles.emptyTable}>
                  <Text style={styles.emptyIcon}>🍼</Text>
                  <Text style={styles.emptyText}>点击左侧按钮记录喂奶</Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  leftCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mainBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnIcon: {
    fontSize: 28,
  },
  mainBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  elapsedLabel: {
    ...typography.caption1,
    color: colors.accent,
    fontWeight: '500',
    fontSize: 10,
  },
  rightCol: {
    flex: 1,
    height: 146,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dateLabel: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearBtnText: {
    ...typography.caption2,
    color: colors.muted,
    fontWeight: '500',
  },
  recordTable: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  recordHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.xs + 2,
  },
  recordHeaderCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  recordHeaderText: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
  },
  recordList: {
    height: 96,
  },
  recordItem: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  recordItemAlt: {
    backgroundColor: colors.surfaceSecondary + '60',
  },
  recordCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    height: 32,
  },
  recordIndex: {
    ...typography.footnote,
    color: colors.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  recordTime: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
    textAlign: 'center',
  },
  emptyTable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  emptyText: {
    ...typography.footnote,
    color: colors.muted,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  loadingText: { ...typography.footnote, color: colors.muted },
});

export default FeedingTimer;
