import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';
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

  // 加载今日喂奶记录
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const all = await loadFeedingRecords(userId);
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

  // 保存喂奶记录（直接写入，避免读取旧数据）
  const allRecordsRef = useRef<FeedingRecordData[]>([]);
  useEffect(() => {
    if (!userId) return;
    loadFeedingRecords(userId).then(all => { allRecordsRef.current = all; });
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
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // 距离上次喂奶的分钟数
  const [elapsedMin, setElapsedMin] = useState<number | null>(null);
  useEffect(() => {
    const calc = () => {
      if (records.length === 0) { setElapsedMin(null); return; }
      const last = records[0].time; // HH:MM:SS
      const [h, m, s] = last.split(':').map(Number);
      const now = new Date();
      const lastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s);
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
              <Text style={styles.mainBtnText}>喂奶</Text>
            </TouchableOpacity>
            <Text style={styles.countLabel}>今日 {records.length} 次</Text>
            {elapsedMin !== null && elapsedMin >= 0 && (
              <Text style={styles.elapsedLabel}>
                距上次 {elapsedMin < 60 ? `${elapsedMin}分钟` : `${Math.floor(elapsedMin / 60)}小时${elapsedMin % 60}分钟`}
              </Text>
            )}
          </View>

          {/* 右侧：历史记录 */}
          <View style={styles.rightCol}>
            <Text style={styles.dateLabel}>{dateStr}</Text>
            <ScrollView style={styles.recordList} showsVerticalScrollIndicator={false}>
              {records.length > 0 ? (
                records.map((r, i) => (
                  <View key={r.id} style={styles.recordItem}>
                    <Text style={styles.recordIndex}>#{records.length - i}</Text>
                    <Text style={styles.recordTime}>{r.time}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>点击左侧按钮记录喂奶</Text>
                </View>
              )}
            </ScrollView>
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
    height: 170,
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
  countLabel: {
    ...typography.caption1,
    color: colors.muted,
    fontWeight: '500',
  },
  elapsedLabel: {
    ...typography.caption1,
    color: colors.accent,
    fontWeight: '500',
    fontSize: 10,
  },
  rightCol: {
    flex: 1,
    height: 140,
  },
  dateLabel: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  recordList: {
    maxHeight: 160,
    minHeight: 80,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  recordIndex: {
    ...typography.footnote,
    color: colors.muted,
    fontWeight: '500',
    minWidth: 24,
  },
  recordTime: {
    ...typography.callout,
    fontWeight: '600',
    color: colors.fg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
