import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';
import { loadFeedingRecords, saveFeedingRecords, FeedingRecordData } from '../../lib/storage';

interface FeedingRecord {
  id: number;
  time: string;
}

export function FeedingTimer({ userId }: { userId: string; babyGender?: string }) {
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const nextId = useRef(1);
  const todayStr = new Date().toISOString().split('T')[0];

  // 加载今日喂奶记录
  useEffect(() => {
    if (!userId) return;
    loadFeedingRecords(userId).then(all => {
      const todaysRecords = all.filter(r => r.date === todayStr);
      setRecords(todaysRecords.map(r => ({ id: r.id, time: r.time })));
      const maxId = todaysRecords.reduce((max, r) => Math.max(max, r.id), 0);
      nextId.current = maxId + 1;
    });
  }, [userId]);

  // 保存喂奶记录
  const persistRecords = (newRecords: FeedingRecord[]) => {
    if (!userId) return;
    loadFeedingRecords(userId).then(all => {
      const otherDays = all.filter(r => r.date !== todayStr);
      const todaysRecords: FeedingRecordData[] = newRecords.map(r => ({
        id: r.id, time: r.time, date: todayStr,
      }));
      saveFeedingRecords(userId, [...otherDays, ...todaysRecords]);
    });
  };

  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

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
      {/* 左侧：大按钮 */}
      <View style={styles.leftCol}>
        <TouchableOpacity style={styles.mainBtn} onPress={handleFeed} activeOpacity={0.8}>
          <Text style={styles.mainBtnIcon}>🍼</Text>
          <Text style={styles.mainBtnText}>喂奶</Text>
        </TouchableOpacity>
        <Text style={styles.countLabel}>今日 {records.length} 次</Text>
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
});

export default FeedingTimer;
