import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import { loadKickRecords, saveKickRecords, KickRecordData } from '../../lib/storage';
import { LoadingDot } from './ToolBase';

const SESSION_MINUTES = 60; // 每次计数时段时长（分钟）

export function KickCounter({ userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const [records, setRecords] = useState<KickRecordData[]>([]);
  const [allRecords, setAllRecords] = useState<KickRecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [remainingMin, setRemainingMin] = useState(SESSION_MINUTES);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  // Load all records
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const all = await loadKickRecords(userId);
        setAllRecords(all);
        const today = all.find(r => r.date === todayStr);
        if (today) {
          const lastSession = today.sessions[today.sessions.length - 1];
          if (lastSession && isSessionActive(lastSession.startTime)) {
            setSessionActive(true);
            setSessionCount(lastSession.count);
            setSessionStart(lastSession.startTime);
          }
          setRecords([today]);
        }
      } catch (e) {
        console.error('Failed to load kick records:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const isSessionActive = (startTime: string) => {
    const elapsed = (Date.now() - new Date(startTime).getTime()) / 60000;
    return elapsed < SESSION_MINUTES;
  };

  // 倒计时更新
  useEffect(() => {
    if (!sessionActive || !sessionStart) return;
    const update = () => {
      const elapsed = (Date.now() - new Date(sessionStart).getTime()) / 60000;
      const remaining = Math.max(0, SESSION_MINUTES - elapsed);
      setRemainingMin(Math.ceil(remaining));
      if (remaining <= 0) {
        setSessionActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    update();
    timerRef.current = setInterval(update, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionActive, sessionStart]);

  const persistTodayRecord = useCallback((todayData: KickRecordData) => {
    if (!userId) return;
    loadKickRecords(userId).then(prev => {
      const otherDays = prev.filter(r => r.date !== todayStr);
      const merged = [...otherDays, todayData];
      setAllRecords(merged);
      saveKickRecords(userId, merged);
    });
  }, [userId]);

  const handleKick = () => {
    const now = new Date().toISOString();

    if (!sessionActive) {
      // 开始一个新的计数时段
      setSessionActive(true);
      setSessionCount(1);
      setSessionStart(now);
      setRemainingMin(SESSION_MINUTES);

      // 合并到现有记录，而不是替换
      const existing = records.find(r => r.date === todayStr);
      const newSession = { startTime: now, count: 1 };
      const updatedSessions = existing ? [...existing.sessions, newSession] : [newSession];
      const todayData: KickRecordData = {
        date: todayStr,
        count: (existing?.count || 0) + 1,
        sessions: updatedSessions,
      };
      setRecords([todayData]);
      persistTodayRecord(todayData);
    } else {
      // 在当前时段+1
      const newCount = sessionCount + 1;
      setSessionCount(newCount);

      const existing = records.find(r => r.date === todayStr);
      const sessions = existing?.sessions || [];
      const updatedSessions = sessions.map((s, i) =>
        i === sessions.length - 1 ? { ...s, count: s.count + 1 } : s
      );
      const todayData: KickRecordData = {
        date: todayStr,
        count: (existing?.count || 0) + 1,
        sessions: updatedSessions,
      };
      setRecords([todayData]);
      persistTodayRecord(todayData);
    }
  };

  const handleEndSession = () => {
    if (sessionActive) {
      const now = new Date().toISOString();
      // 更新最后一个时段的结束时间
      const existing = records.find(r => r.date === todayStr);
      if (existing && existing.sessions.length > 0) {
        const updatedSessions = existing.sessions.map((s, i) =>
          i === existing.sessions.length - 1 ? { ...s, endTime: now } : s
        );
        const todayData: KickRecordData = {
          date: todayStr,
          count: existing.count,
          sessions: updatedSessions,
        };
        setRecords([todayData]);
        persistTodayRecord(todayData);
      }
      setSessionActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleClearAll = () => {
    if (!todayData || todayData.sessions.length === 0) return;
    const msg = `确定清除今日 ${todayData.sessions.length} 条计数时段吗？此操作不可撤销。`;
    const doClear = () => {
      // 从 allRecords 中移除今日记录
      const otherDays = allRecords.filter(r => r.date !== todayStr);
      setAllRecords(otherDays);
      setRecords([]);
      setSessionActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      saveKickRecords(userId, otherDays);
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

  const todayData = records.find(r => r.date === todayStr);
  const totalToday = todayData?.count || 0;
  const latestSession = todayData?.sessions[todayData.sessions.length - 1];

  const styles = useMemo(() => StyleSheet.create({
    container: { gap: spacing.lg },
    counterSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.accentLight,
      borderRadius: radius.md,
    },
    counterBtnWrapper: {
      flexDirection: 'row',
      borderRadius: radius.md,
      overflow: 'hidden',
      ...shadows.sm,
    },
    counterBtn: {
      width: 96, height: 72,
      backgroundColor: colors.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    counterBtnActive: {
      backgroundColor: colors.accentDark,
    },
    endBtn: {
      width: 96, height: 72,
      backgroundColor: colors.accent,
      alignItems: 'center', justifyContent: 'center',
      borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)',
    },
    endBtnDisabled: {
      backgroundColor: colors.surfaceSecondary,
    },
    endBtnText: {
      ...typography.subhead,
      color: '#fff',
      fontWeight: '600',
    },
    endBtnTextDisabled: {
      color: colors.muted,
    },
    countText: {
      ...typography.largeTitle,
      color: '#fff',
      fontWeight: '700',
    },
    hint: {
      ...typography.caption2,
      color: colors.fgSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 16,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...shadows.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    sectionTitle: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.fgSecondary,
    },
    sectionTotal: {
      ...typography.caption2,
      color: colors.accent,
      fontWeight: '600',
    },
    clearBtn: {
      ...typography.caption2,
      color: colors.error,
      fontWeight: '600',
    },
    historyContainer: { height: 140 },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    historyDate: { ...typography.footnote, color: colors.fgSecondary, flex: 1 },
    historyTime: { ...typography.footnote, color: colors.fgSecondary, flex: 1, marginRight: spacing.sm },
    historyCount: { ...typography.callout, fontWeight: '600', color: colors.fg },
    emptyState: {
      height: 140,
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
          {/* 计数按钮 */}
          <View style={styles.counterSection}>
            <View style={styles.counterBtnWrapper}>
              <TouchableOpacity
                style={[styles.counterBtn, sessionActive && styles.counterBtnActive]}
                onPress={handleKick}
                activeOpacity={0.7}
              >
                <Text style={styles.countText}>{sessionActive ? sessionCount : 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.endBtn, !sessionActive && styles.endBtnDisabled]}
                onPress={handleEndSession}
                disabled={!sessionActive}
                activeOpacity={0.7}
              >
                <Text style={[styles.endBtnText, !sessionActive && styles.endBtnTextDisabled]}>{sessionActive ? '结束' : '--'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              胎宝宝连续动几下算1次，点击一次计数1次
            </Text>
          </View>

          {/* 今日计数时段 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>今日计数时段</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Text style={styles.sectionTotal}>今日共 {totalToday} 次胎动</Text>
                {todayData && todayData.sessions.length > 0 && (
                  <TouchableOpacity onPress={handleClearAll} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.clearBtn}>清除</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {todayData && todayData.sessions.length > 0 ? (
              <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
                {[...todayData.sessions].reverse().map((s, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <Text style={styles.historyTime}>
                      {new Date(s.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      {s.endTime ? ` - ${new Date(s.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ' 进行中'}
                    </Text>
                    <Text style={styles.historyCount}>{s.count} 次</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="pulse-outline" size={20} color={colors.muted} style={{ marginBottom: 4 }} />
                <Text style={styles.emptyText}>还没有记录，点击上方按钮开始</Text>
              </View>
            )}
          </View>

          {/* 历史记录 */}
          {(() => {
            const pastDays = allRecords.filter(r => r.date !== todayStr).sort((a, b) => b.date.localeCompare(a.date));
            if (pastDays.length === 0) return null;
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>历史记录</Text>
                </View>
                <ScrollView style={{ maxHeight: 140 }} showsVerticalScrollIndicator={false}>
                  {pastDays.map((day) => (
                    <View key={day.date} style={styles.historyItem}>
                      <Text style={styles.historyDate}>{day.date.replace(/-/g, '/')}</Text>
                      <Text style={styles.historyCount}>{day.count} 次</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            );
          })()}
        </>
      )}
    </View>
  );
}

export default KickCounter;
