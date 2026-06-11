import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import {
  loadBabyCareLog, saveBabyCareLog, BabyCareLogEntry,
  DiaperRecord, FeedingRecord, TummyTimeRecord,
} from '../../lib/storage';

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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

// ─── Tab 配置 ───
type CareTab = 'diaper' | 'feeding' | 'tummy';

const TAB_CONFIG: { key: CareTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'diaper', label: '尿布', icon: 'water-outline' },
  { key: 'feeding', label: '喂奶', icon: 'nutrition-outline' },
  { key: 'tummy', label: '俯趴', icon: 'body-outline' },
];

// 尿布颜色/性状标签
const DIAPER_COLORS: Record<string, string> = {
  yellow: '黄色',
  green: '绿色',
  brown: '棕色',
  black: '黑色',
  red: '红色',
  white: '白色',
};

const DIAPER_CONSISTENCY: Record<string, string> = {
  normal: '正常',
  watery: '水样',
  hard: '干硬',
  mucus: '黏液',
};

// ─── 主组件 ───
export function BabyCareLog({ userId, expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const [entries, setEntries] = useState<BabyCareLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<CareTab>('diaper');
  const [loading, setLoading] = useState(true);
  const submittedRef = useRef(false);

  // ── 加载数据 ──
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      try {
        const data = await loadBabyCareLog(userId);
        setEntries(data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      } catch (e) {
        console.error('Failed to load baby care log:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persist = useCallback((data: BabyCareLogEntry[]) => {
    if (!userId) return;
    saveBabyCareLog(userId, data);
  }, [userId]);

  // ── 今天的记录 ──
  const today = getTodayStr();
  const todayEntries = useMemo(() => entries.filter(e => e.date === today), [entries, today]);

  const todayDiapers = useMemo(() => todayEntries.filter(e => e.type === 'diaper'), [todayEntries]);
  const todayFeedings = useMemo(() => todayEntries.filter(e => e.type === 'feeding'), [todayEntries]);
  const todayTummy = useMemo(() => todayEntries.filter(e => e.type === 'tummy'), [todayEntries]);

  // ── 快速记录：尿布 ──
  const quickDiaper = (type: DiaperRecord['type']) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const now = new Date().toISOString();
    const record: BabyCareLogEntry = {
      id: generateId(),
      timestamp: now,
      date: today,
      type: 'diaper',
      data: { id: generateId(), timestamp: now, date: today, type } as DiaperRecord,
    };
    const newEntries = [record, ...entries];
    setEntries(newEntries);
    persist(newEntries);
    setTimeout(() => { submittedRef.current = false; }, 500);
  };

  // ── 快速记录：喂奶 ──
  const [showFeedingInput, setShowFeedingInput] = useState(false);
  const [feedingType, setFeedingType] = useState<FeedingRecord['type']>('breast_both');
  const [feedingAmount, setFeedingAmount] = useState('');

  const submitFeeding = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const now = new Date().toISOString();
    const record: BabyCareLogEntry = {
      id: generateId(),
      timestamp: now,
      date: today,
      type: 'feeding',
      data: {
        id: generateId(), timestamp: now, date: today,
        type: feedingType,
        amountMl: feedingType === 'formula' || feedingType === 'mixed' ? (parseInt(feedingAmount) || 0) : undefined,
      } as FeedingRecord,
    };
    const newEntries = [record, ...entries];
    setEntries(newEntries);
    persist(newEntries);
    setShowFeedingInput(false);
    setFeedingAmount('');
    setTimeout(() => { submittedRef.current = false; }, 500);
  };

  // ── 快速记录：俯趴时间 ──
  const [tummyTimerRunning, setTummyTimerRunning] = useState(false);
  const [tummyStartTime, setTummyStartTime] = useState<Date | null>(null);
  const [tummyElapsed, setTummyElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTummyTimer = () => {
    const now = new Date();
    setTummyStartTime(now);
    setTummyTimerRunning(true);
    setTummyElapsed(0);
    timerRef.current = setInterval(() => {
      setTummyElapsed(Math.floor((Date.now() - now.getTime()) / 1000));
    }, 1000);
  };

  const stopTummyTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (submittedRef.current || !tummyStartTime) return;
    submittedRef.current = true;
    const elapsed = Math.floor((Date.now() - tummyStartTime.getTime()) / 1000);
    if (elapsed < 5) {
      setTummyTimerRunning(false);
      setTummyStartTime(null);
      setTummyElapsed(0);
      submittedRef.current = false;
      return;
    }
    const now = new Date().toISOString();
    const record: BabyCareLogEntry = {
      id: generateId(),
      timestamp: tummyStartTime.toISOString(),
      date: today,
      type: 'tummy',
      data: { id: generateId(), timestamp: now, date: today, durationSec: elapsed } as TummyTimeRecord,
    };
    const newEntries = [record, ...entries];
    setEntries(newEntries);
    persist(newEntries);
    setTummyTimerRunning(false);
    setTummyStartTime(null);
    setTummyElapsed(0);
    setTimeout(() => { submittedRef.current = false; }, 500);
  };

  // ── 删除 ──
  const removeEntry = (id: string) => {
    const doDel = () => {
      const newEntries = entries.filter(e => e.id !== id);
      setEntries(newEntries);
      persist(newEntries);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('确定删除这条记录吗？')) doDel();
    } else {
      Alert.alert('删除记录', '确定删除这条记录吗？', [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDel },
      ]);
    }
  };

  // ── 样式 ──
  const styles = useMemo(() => StyleSheet.create({
    container: { maxHeight: expanded ? undefined : 560 },
    // Tab bar
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.xs,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
    },
    tabActive: { backgroundColor: colors.accent },
    tabText: { ...typography.caption1, fontWeight: '500', color: colors.fgSecondary },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    tabCount: {
      ...typography.caption2,
      fontWeight: '600',
      color: colors.accent,
      backgroundColor: colors.accentLight,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 8,
      overflow: 'hidden',
    },
    tabCountActive: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' },

    // 快速操作区
    quickActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexWrap: 'wrap',
    },
    quickBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...shadows.sm,
    },
    quickBtnPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
    quickBtnText: { ...typography.footnote, fontWeight: '600', color: colors.fg },
    quickBtnTextPrimary: { color: '#fff' },
    quickBtnIcon: { marginRight: 2 },

    // 喂奶输入弹窗
    feedingPanel: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    feedingTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    feedingTypeBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    feedingTypeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    feedingTypeText: { ...typography.footnote, color: colors.fgSecondary },
    feedingTypeTextActive: { color: '#fff', fontWeight: '600' },
    feedingInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    feedingInput: {
      flex: 1,
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.bg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      height: 44,
    },
    feedingUnit: { ...typography.footnote, color: colors.muted },
    feedingSubmit: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedingSubmitText: { ...typography.callout, fontWeight: '600', color: '#fff' },
    feedingCancel: {
      paddingHorizontal: spacing.md,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedingCancelText: { ...typography.footnote, color: colors.muted },

    // 俯趴计时器
    tummyTimerBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    tummyTimerTime: { fontSize: 48, fontWeight: '700', color: colors.accent, letterSpacing: -1, fontVariant: ['tabular-nums'] },
    tummyTimerHint: { ...typography.footnote, color: colors.muted, marginTop: spacing.sm },
    tummyTimerBtn: {
      marginTop: spacing.lg,
      width: 64, height: 64, borderRadius: 32,
      alignItems: 'center', justifyContent: 'center',
      ...shadows.md,
    },
    tummyTimerBtnStart: { backgroundColor: colors.success },
    tummyTimerBtnStop: { backgroundColor: colors.error },

    // 今日概要数字
    todaySummary: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    todaySummaryItem: { flex: 1, alignItems: 'center' },
    todaySummaryNum: { fontSize: 24, fontWeight: '700', color: colors.accent },
    todaySummaryLabel: { ...typography.caption1, color: colors.muted, marginTop: 2 },

    // 历史记录
    historySection: { marginTop: spacing.xs },
    historyTitle: { ...typography.subhead, fontWeight: '600', color: colors.fg, marginBottom: spacing.sm },
    entryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    entryLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    entryTime: { ...typography.footnote, color: colors.muted },
    entryTag: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.accentLight,
    },
    entryTagText: { ...typography.caption2, fontWeight: '600', color: colors.accent },
    entryDetail: { ...typography.footnote, color: colors.fgSecondary, marginTop: spacing.xs, marginLeft: spacing.xl + 4 },
    delBtn: { padding: spacing.xs },
    delBtnText: { ...typography.caption1, color: colors.error, fontWeight: '600' },

    emptyState: {
      paddingVertical: spacing.xxl + 8,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyText: { ...typography.footnote, color: colors.muted, textAlign: 'center' },
  }), [colors, expanded]);

  // ── 渲染"尿布"tab ──
  const renderDiaperTab = () => (
    <>
      {/* 快速记录按钮 */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => quickDiaper('wet')} activeOpacity={0.7}>
          <Ionicons name="water" size={16} color="#4A90D9" />
          <Text style={styles.quickBtnText}>湿</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => quickDiaper('dirty')} activeOpacity={0.7}>
          <Ionicons name="alert-circle" size={16} color="#B8963E" />
          <Text style={styles.quickBtnText}>便便</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: colors.accent + '10' }]} onPress={() => quickDiaper('both')} activeOpacity={0.7}>
          <Ionicons name="layers" size={16} color={colors.accent} />
          <Text style={styles.quickBtnText}>湿+便便</Text>
        </TouchableOpacity>
      </View>

      {/* 最近尿布记录 */}
      {todayDiapers.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="water-outline" size={32} color={colors.muted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyText}>今天还没有尿布记录</Text>
        </View>
      )}
    </>
  );

  // ── 渲染"喂奶"tab ──
  const renderFeedingTab = () => (
    <>
      {/* 快速记录 */}
      {!showFeedingInput ? (
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnPrimary]} onPress={() => { setFeedingType('breast_both'); setShowFeedingInput(true); }} activeOpacity={0.7}>
            <Ionicons name="woman-outline" size={16} color="#fff" />
            <Text style={[styles.quickBtnText, styles.quickBtnTextPrimary]}>亲喂</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => { setFeedingType('formula'); setShowFeedingInput(true); }} activeOpacity={0.7}>
            <Ionicons name="cash-outline" size={16} color="#4A90D9" />
            <Text style={styles.quickBtnText}>奶瓶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => { setFeedingType('mixed'); setShowFeedingInput(true); }} activeOpacity={0.7}>
            <Ionicons name="swap-horizontal" size={16} color={colors.accent} />
            <Text style={styles.quickBtnText}>混合</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.feedingPanel}>
          <View style={styles.feedingTypeRow}>
            {([
              { key: 'breast_left' as const, label: '左乳' },
              { key: 'breast_right' as const, label: '右乳' },
              { key: 'breast_both' as const, label: '双侧' },
              { key: 'formula' as const, label: '配方奶' },
              { key: 'mixed' as const, label: '混合' },
            ]).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.feedingTypeBtn, feedingType === opt.key && styles.feedingTypeBtnActive]}
                onPress={() => setFeedingType(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.feedingTypeText, feedingType === opt.key && styles.feedingTypeTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {(feedingType === 'formula' || feedingType === 'mixed') && (
            <View style={styles.feedingInputRow}>
              <TextInput
                style={styles.feedingInput}
                value={feedingAmount}
                onChangeText={setFeedingAmount}
                placeholder="奶量"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.feedingUnit}>ml</Text>
            </View>
          )}
          <View style={[styles.feedingInputRow, { marginTop: spacing.md }]}>
            <TouchableOpacity style={styles.feedingCancel} onPress={() => setShowFeedingInput(false)} activeOpacity={0.7}>
              <Text style={styles.feedingCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedingSubmit} onPress={submitFeeding} activeOpacity={0.7}>
              <Text style={styles.feedingSubmitText}>记录</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showFeedingInput && todayFeedings.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="nutrition-outline" size={32} color={colors.muted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyText}>今天还没有喂奶记录</Text>
        </View>
      )}
    </>
  );

  // ── 渲染"俯趴"tab ──
  const renderTummyTab = () => (
    <>
      {/* 计时器 */}
      <View style={styles.tummyTimerBox}>
        <Text style={styles.tummyTimerTime}>
          {tummyTimerRunning
            ? `${Math.floor(tummyElapsed / 60)}:${String(tummyElapsed % 60).padStart(2, '0')}`
            : '--:--'}
        </Text>
        <Text style={styles.tummyTimerHint}>
          {tummyTimerRunning ? '正在计时…' : '点击下方按钮开始'}
        </Text>
        <TouchableOpacity
          style={[styles.tummyTimerBtn, tummyTimerRunning ? styles.tummyTimerBtnStop : styles.tummyTimerBtnStart]}
          onPress={tummyTimerRunning ? stopTummyTimer : startTummyTimer}
          activeOpacity={0.7}
        >
          <Ionicons name={tummyTimerRunning ? 'stop' : 'play'} size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 今日俯趴汇总 */}
      {todayTummy.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.historyTitle}>
            今日共 {formatDuration(todayTummy.reduce((s, e) => s + (e.data as TummyTimeRecord).durationSec, 0))}
          </Text>
        </View>
      )}

      {todayTummy.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="body-outline" size={32} color={colors.muted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyText}>今天还没有俯趴记录</Text>
        </View>
      )}
    </>
  );

  // ── 全部历史记录（按日期聚合） ──
  const historyByDate = useMemo(() => {
    const map = new Map<string, BabyCareLogEntry[]>();
    for (const e of entries) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  // ── 渲染入口 ──
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {/* 今日数字摘要 */}
      <View style={styles.todaySummary}>
        <View style={styles.todaySummaryItem}>
          <Text style={styles.todaySummaryNum}>{todayDiapers.length}</Text>
          <Text style={styles.todaySummaryLabel}>尿布</Text>
        </View>
        <View style={styles.todaySummaryItem}>
          <Text style={styles.todaySummaryNum}>{todayFeedings.length}</Text>
          <Text style={styles.todaySummaryLabel}>喂奶</Text>
        </View>
        <View style={styles.todaySummaryItem}>
          <Text style={styles.todaySummaryNum}>
            {todayTummy.length > 0
              ? Math.floor(todayTummy.reduce((s, e) => s + (e.data as TummyTimeRecord).durationSec, 0) / 60) + '分'
              : '0'}
          </Text>
          <Text style={styles.todaySummaryLabel}>俯趴</Text>
        </View>
      </View>

      {/* Tab 栏 */}
      <View style={styles.tabRow}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.key;
          const count = tab.key === 'diaper' ? todayDiapers.length
            : tab.key === 'feeding' ? todayFeedings.length
            : todayTummy.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.icon} size={14} color={isActive ? '#fff' : colors.muted} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              {count > 0 && (
                <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>{count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab 内容 */}
      {activeTab === 'diaper' && renderDiaperTab()}
      {activeTab === 'feeding' && renderFeedingTab()}
      {activeTab === 'tummy' && renderTummyTab()}

      {/* 今日该tab的详细记录 */}
      <View style={styles.historySection}>
        {activeTab === 'diaper' && todayDiapers.length > 0 && (
          <>
            <Text style={styles.historyTitle}>今天尿布记录</Text>
            {todayDiapers.map(e => {
              const d = e.data as DiaperRecord;
              const label = d.type === 'wet' ? '湿' : d.type === 'dirty' ? '便便' : '湿+便便';
              return (
                <View key={e.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      <Ionicons name="time-outline" size={14} color={colors.muted} />
                      <Text style={styles.entryTime}>{formatTime(e.timestamp)}</Text>
                      <View style={styles.entryTag}><Text style={styles.entryTagText}>{label}</Text></View>
                    </View>
                    <TouchableOpacity style={styles.delBtn} onPress={() => removeEntry(e.id)}>
                      <Text style={styles.delBtnText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'feeding' && todayFeedings.length > 0 && (
          <>
            <Text style={styles.historyTitle}>今天喂奶记录</Text>
            {todayFeedings.map(e => {
              const f = e.data as FeedingRecord;
              const labels: Record<string, string> = { breast_left: '左乳', breast_right: '右乳', breast_both: '双侧', formula: '配方奶', mixed: '混合' };
              return (
                <View key={e.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      <Ionicons name="time-outline" size={14} color={colors.muted} />
                      <Text style={styles.entryTime}>{formatTime(e.timestamp)}</Text>
                      <View style={styles.entryTag}><Text style={styles.entryTagText}>{labels[f.type] || f.type}</Text></View>
                    </View>
                    <TouchableOpacity style={styles.delBtn} onPress={() => removeEntry(e.id)}>
                      <Text style={styles.delBtnText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                  {(f.type === 'formula' || f.type === 'mixed') && f.amountMl ? (
                    <Text style={styles.entryDetail}>{f.amountMl} ml</Text>
                  ) : null}
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'tummy' && todayTummy.length > 0 && (
          <>
            <Text style={styles.historyTitle}>今天俯趴记录</Text>
            {todayTummy.map(e => {
              const t = e.data as TummyTimeRecord;
              return (
                <View key={e.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLeft}>
                      <Ionicons name="time-outline" size={14} color={colors.muted} />
                      <Text style={styles.entryTime}>{formatTime(e.timestamp)}</Text>
                      <View style={styles.entryTag}><Text style={styles.entryTagText}>{formatDuration(t.durationSec)}</Text></View>
                    </View>
                    <TouchableOpacity style={styles.delBtn} onPress={() => removeEntry(e.id)}>
                      <Text style={styles.delBtnText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </View>
    </ScrollView>
  );
}

export default BabyCareLog;
