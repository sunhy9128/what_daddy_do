import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Alert, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows, ColorScheme } from '../../styles/tokens';
import {
  loadMoodRecords, saveMoodRecords, MoodRecord,
  loadMoodConfig, saveMoodConfig, MoodConfig,
} from '../../lib/storage';
import { LoadingDot } from './ToolBase';
import { LineChart } from 'react-native-gifted-charts';

// ─── EPDS 题目（适配爸爸版本） ───
interface Question {
  id: number;
  text: string;
  options: { label: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: '我能够开怀大笑，并看到事情有趣的一面',
    options: [
      { label: '和以前一样', score: 0 },
      { label: '不如以前那么多', score: 1 },
      { label: '明显不如以前', score: 2 },
      { label: '完全不能', score: 3 },
    ],
  },
  {
    id: 2,
    text: '我期待着享受事情（期待愉快的事）',
    options: [
      { label: '和以前一样', score: 0 },
      { label: '比以前少一些', score: 1 },
      { label: '比以往少了很多', score: 2 },
      { label: '几乎从不', score: 3 },
    ],
  },
  {
    id: 3,
    text: '当事情出错时，我会不必要地责备自己',
    options: [
      { label: '不会这样', score: 0 },
      { label: '偶尔会', score: 1 },
      { label: '经常会', score: 2 },
      { label: '总是会', score: 3 },
    ],
  },
  {
    id: 4,
    text: '我会无缘无故地感到焦虑或担心',
    options: [
      { label: '完全不会', score: 0 },
      { label: '偶尔会', score: 1 },
      { label: '经常会', score: 2 },
      { label: '总是会', score: 3 },
    ],
  },
  {
    id: 5,
    text: '我会无缘无故地感到害怕或惊慌',
    options: [
      { label: '完全不会', score: 0 },
      { label: '偶尔会', score: 1 },
      { label: '经常会', score: 2 },
      { label: '总是会', score: 3 },
    ],
  },
  {
    id: 6,
    text: '事情发展到我无法应付的地步',
    options: [
      { label: '完全能应付', score: 0 },
      { label: '大多数时候能应付', score: 1 },
      { label: '有时候不能应付', score: 2 },
      { label: '基本不能应付', score: 3 },
    ],
  },
  {
    id: 7,
    text: '我睡眠太差而难以入睡或保持睡眠',
    options: [
      { label: '和以前一样', score: 0 },
      { label: '比以前稍差', score: 1 },
      { label: '比以往差很多', score: 2 },
      { label: '几乎无法入睡', score: 3 },
    ],
  },
  {
    id: 8,
    text: '我感到悲伤或痛苦',
    options: [
      { label: '完全不会', score: 0 },
      { label: '偶尔会', score: 1 },
      { label: '经常会', score: 2 },
      { label: '总是会', score: 3 },
    ],
  },
  {
    id: 9,
    text: '我太不开心，以至于哭泣',
    options: [
      { label: '完全不会', score: 0 },
      { label: '偶尔会', score: 1 },
      { label: '经常会', score: 2 },
      { label: '总是会', score: 3 },
    ],
  },
  {
    id: 10,
    text: '我有伤害自己的想法',
    options: [
      { label: '完全没有', score: 0 },
      { label: '偶尔有', score: 1 },
      { label: '有时有', score: 2 },
      { label: '经常有', score: 3 },
    ],
  },
];

// ─── 评分解读（主题感知） ───
function getInterpretation(score: number, colors: ColorScheme): { level: string; color: string; advice: string } {
  if (score <= 9) {
    return {
      level: '正常范围',
      color: colors.success,
      advice: '你的情绪状态良好。建议保持规律作息，持续关注自己的情绪变化，与家人多沟通。',
    };
  }
  if (score <= 12) {
    return {
      level: '轻度困扰',
      color: colors.warning,
      advice: '你正在经历一些情绪困扰。建议多与伴侣/朋友聊聊，注意休息和放松。如果持续两周以上，可考虑寻求专业帮助。',
    };
  }
  return {
    level: '需要关注',
    color: colors.error,
    advice: '你的情绪状态需要重视。强烈建议你与家人沟通，并考虑寻求心理咨询或医生的专业帮助。你并不孤单，很多爸爸都经历过类似感受。',
  };
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── 简易趋势图（gifted-charts LineChart） ───
function MoodTrendChart({ records }: { records: MoodRecord[] }) {
  const colors = useColors();
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const maxScore = Math.max(30, ...sorted.map(r => r.score));

  if (sorted.length < 1) return null;

  // 数据点：分数、颜色编码、日期标签（稀疏显示）
  const showLabelIdx = new Set<number>();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || i === sorted.length - 1 || i % Math.max(1, Math.floor(sorted.length / 4)) === 0) {
      showLabelIdx.add(i);
    }
  }

  const data = sorted.map((r, idx) => ({
    value: r.score,
    dataPointText: String(r.score),
    textFontSize: 8,
    textColor: '#fff',
    dataPointColor: r.score >= 13 ? colors.error : r.score >= 10 ? colors.warning : colors.success,
    label: showLabelIdx.has(idx) ? r.date.slice(5) : undefined,
    labelTextStyle: { fontSize: 7, transform: [{ rotate: '-30deg' }] as any },
  }));

  const pointSpacing = sorted.length > 1 ? 240 / (sorted.length - 1) : 240;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadows.sm }}>
      <Text style={{ ...typography.caption1, fontWeight: '600', color: colors.fgSecondary, marginBottom: spacing.sm }}>
        趋势
      </Text>
      <LineChart
        data={data}
        height={120}
        width={240}
        maxValue={maxScore}
        noOfSections={3}
        initialSpacing={20}
        spacing={pointSpacing}
        thickness={2}
        color={colors.accent + '60'}
        // 引用线：10 分警戒线
        showReferenceLine1
        referenceLine1Position={10}
        referenceLine1Config={{
          color: colors.warning + '80',
          thickness: 1,
          labelText: '轻度线 10',
          labelTextStyle: { fontSize: 7, color: colors.muted },
        } as any}
        // 轴 + 标签
        yAxisColor="transparent"
        yAxisThickness={0}
        yAxisTextStyle={{ fontSize: 8, color: colors.muted, width: 20, textAlign: 'right' }}
        yAxisLabelWidth={22}
        xAxisColor="transparent"
        xAxisThickness={0}
        xAxisLabelTextStyle={{ fontSize: 7, color: colors.muted, width: 28, textAlign: 'center' }}
        xAxisLabelsVerticalShift={2}
        // 网格线
        rulesColor={colors.divider}
        rulesType="solid"
        rulesThickness={0.5}
        // 关闭多余渲染
        showXAxisIndices={false}
        showYAxisIndices={false}
        roundToDigits={0}
        isAnimated={false}
        hideDataPoints={false}
        showDataPointOnFocus={false}
        pointerConfig={undefined}
      />
    </View>
  );
}

// ─── 主组件 ───
export function MoodCheckIn({ userId, expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const [config, setConfig] = useState<MoodConfig | null>(null);
  const [records, setRecords] = useState<MoodRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // UI 状态
  const [mode, setMode] = useState<'idle' | 'quiz' | 'result'>('idle');
  const [answers, setAnswers] = useState<number[]>([]);
  const [latestResult, setLatestResult] = useState<{ score: number; record: MoodRecord } | null>(null);
  const [nameInput, setNameInput] = useState('');

  const submittedRef = useRef(false);

  // 加载数据
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const [cfg, recs] = await Promise.all([
          loadMoodConfig(userId),
          loadMoodRecords(userId),
        ]);
        if (cfg) setConfig(cfg);
        setRecords(recs.sort((a, b) => a.date.localeCompare(b.date)));
      } catch (e) {
        console.error('Failed to load mood data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persistRecords = useCallback((recs: MoodRecord[]) => {
    if (!userId) return;
    saveMoodRecords(userId, recs);
  }, [userId]);

  // 开始测评
  const startQuiz = () => {
    setAnswers(new Array(QUESTIONS.length).fill(-1));
    setMode('quiz');
  };

  // 选择答案
  const selectAnswer = (qIdx: number, score: number) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = score;
    setAnswers(newAnswers);
  };

  // 所有题目是否已答
  const allAnswered = useMemo(() => answers.every(a => a >= 0), [answers]);

  // 提交测评
  const submitQuiz = () => {
    if (!allAnswered || submittedRef.current) return;
    submittedRef.current = true;
    const totalScore = answers.reduce((s, a) => s + a, 0);
    const today = getTodayStr();
    const record: MoodRecord = {
      id: generateId(),
      date: today,
      score: totalScore,
      answers: [...answers],
    };
    // 替换今天已有记录，或追加
    const existingTodayIdx = records.findIndex(r => r.date === today);
    let newRecords: MoodRecord[];
    if (existingTodayIdx >= 0) {
      newRecords = [...records];
      newRecords[existingTodayIdx] = record;
    } else {
      newRecords = [...records, record];
    }
    newRecords.sort((a, b) => a.date.localeCompare(b.date));
    setRecords(newRecords);
    persistRecords(newRecords);
    setLatestResult({ score: totalScore, record });
    setMode('result');
    submittedRef.current = false;
  };

  // 保存配置
  const saveName = () => {
    if (!nameInput.trim()) return;
    const newConfig: MoodConfig = {
      name: nameInput.trim(),
      createdAt: new Date().toISOString(),
    };
    setConfig(newConfig);
    saveMoodConfig(userId!, newConfig);
  };

  // 最近一次测评
  const lastRecord = useMemo(() => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [records]);

  // 评分分布
  const scoreTrend = useMemo(() => {
    if (records.length < 2) return null;
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0].score;
    const last = sorted[sorted.length - 1].score;
    return { direction: last < first ? 'down' : last > first ? 'up' : 'stable', diff: Math.abs(last - first) };
  }, [records]);

  const styles = useMemo(() => StyleSheet.create({
    container: { maxHeight: expanded ? undefined : 560 },
    // 配置
    configCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      ...shadows.sm,
    },
    configLabel: { ...typography.subhead, fontWeight: '600', color: colors.fg, marginBottom: spacing.xs },
    configValue: { ...typography.callout, fontWeight: '600', color: colors.accent },
    configNote: { ...typography.footnote, color: colors.fgSecondary, marginTop: spacing.xs, lineHeight: 20 },
    // 输入
    inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    input: {
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
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    saveBtnText: { ...typography.callout, fontWeight: '600', color: '#fff' },
    // 概览
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadows.sm,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    summaryScore: { fontSize: 40, fontWeight: '700', color: colors.accent, letterSpacing: -1 },
    summaryUnit: { ...typography.callout, color: colors.muted },
    summaryLabel: { ...typography.footnote, color: colors.fgSecondary },
    summaryTrend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    // 开始按钮
    startBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      ...shadows.md,
    },
    startBtnText: { ...typography.headline, fontWeight: '600', color: '#fff' },
    // 问卷
    quizContainer: { gap: spacing.lg },
    quizHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    quizTitle: { ...typography.title3, fontWeight: '600', color: colors.fg },
    quizProgress: { ...typography.footnote, color: colors.muted, fontWeight: '500' },
    progressBarTrack: {
      height: 4,
      backgroundColor: colors.divider,
      borderRadius: 2,
      marginBottom: spacing.lg,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 2,
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      ...shadows.sm,
    },
    questionNumber: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.accent,
      marginBottom: spacing.sm,
    },
    questionText: { ...typography.callout, fontWeight: '500', color: colors.fg, marginBottom: spacing.md, lineHeight: 24 },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.bg,
    },
    optionRowSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    optionDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    optionDotSelected: { borderColor: colors.accent },
    optionDotInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    optionLabel: { ...typography.subhead, color: colors.fg, flex: 1, lineHeight: 22 },
    optionLabelSelected: { fontWeight: '600' },
    submitBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      ...shadows.sm,
    },
    submitBtnDisabled: { backgroundColor: colors.border, ...shadows.sm, shadowOpacity: 0 },
    submitBtnText: { ...typography.headline, fontWeight: '600', color: '#fff' },
    submitBtnTextDisabled: { color: colors.muted },
    // 结果
    resultContainer: { gap: spacing.lg },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl + 4,
      alignItems: 'center',
      ...shadows.md,
    },
    resultScore: { fontSize: 56, fontWeight: '700', letterSpacing: -2 },
    resultUnit: { ...typography.title3, color: colors.muted, marginTop: spacing.xs },
    resultLevel: { ...typography.headline, fontWeight: '600', marginTop: spacing.md },
    resultAdvice: {
      ...typography.callout,
      color: colors.fgSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginTop: spacing.lg,
      paddingHorizontal: spacing.sm,
    },
    warningCallout: {
      backgroundColor: colors.warning + '12',
      borderRadius: radius.md,
      padding: spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
    },
    warningCalloutText: {
      ...typography.footnote,
      color: colors.fgSecondary,
      lineHeight: 22,
    },
    resultActions: { flexDirection: 'row', gap: spacing.md },
    actionBtn: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    actionBtnPrimary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      ...shadows.sm,
    },
    actionBtnText: { ...typography.callout, fontWeight: '600', color: colors.fgSecondary },
    actionBtnTextPrimary: { color: '#fff' },
    // 历史
    historySection: { marginTop: spacing.lg },
    historyTitle: { ...typography.subhead, fontWeight: '600', color: colors.fg, marginBottom: spacing.sm },
    historyTable: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...shadows.sm,
    },
    historyHeader: {
      flexDirection: 'row',
      backgroundColor: colors.accentLight,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    historyHeaderText: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.fgSecondary,
      textAlign: 'center',
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    historyCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    historyText: { ...typography.callout, color: colors.fg, textAlign: 'center', fontWeight: '500' },
    historyScoreOk: { color: colors.success },
    historyScoreWarn: { color: colors.warning },
    historyScoreHigh: { color: colors.error },
    delBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    delBtnText: { ...typography.caption1, color: colors.error, fontWeight: '600' },
    emptyState: {
      paddingVertical: spacing.xxl + 8,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    emptyIcon: { marginBottom: spacing.xs, opacity: 0.5 },
    emptyText: { ...typography.footnote, color: colors.muted, textAlign: 'center' },
    // Loading
    loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl + 8, gap: spacing.md },
    loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    loadingText: { ...typography.footnote, color: colors.fgSecondary },
  }), [colors, expanded]);

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={150} />
          <LoadingDot delay={300} />
        </View>
        <Text style={styles.loadingText}>加载中…</Text>
      </View>
    );
  }

  // ── 问卷模式 ──
  if (mode === 'quiz') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.quizContainer}>
          <View style={styles.quizHeader}>
            <Text style={styles.quizTitle}>情绪自评</Text>
            <Text style={styles.quizProgress}>
              {answers.filter(a => a >= 0).length}/{QUESTIONS.length}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(answers.filter(a => a >= 0).length / QUESTIONS.length) * 100}%` as any }]} />
          </View>

          {QUESTIONS.map((q, qi) => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionNumber}>Q{q.id}/10</Text>
              <Text style={styles.questionText}>{q.text}</Text>
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === opt.score;
                return (
                  <TouchableOpacity
                    key={oi}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => selectAnswer(qi, opt.score)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionDot, selected && styles.optionDotSelected]}>
                      {selected && <View style={styles.optionDotInner} />}
                    </View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.submitBtn, !allAnswered && styles.submitBtnDisabled]}
            onPress={submitQuiz}
            disabled={!allAnswered}
            activeOpacity={0.7}
          >
            <Text style={[styles.submitBtnText, !allAnswered && styles.submitBtnTextDisabled]}>
              提交测评
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── 结果模式 ──
  if (mode === 'result' && latestResult) {
    const interp = getInterpretation(latestResult.score, colors);
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <Text style={[styles.resultScore, { color: interp.color }]}>{latestResult.score}</Text>
            <Text style={styles.resultUnit}>/ 30分</Text>
            <Text style={[styles.resultLevel, { color: interp.color }]}>{interp.level}</Text>
            <Text style={styles.resultAdvice}>{interp.advice}</Text>
          </View>

          {/* 警告提示 */}
          {latestResult.score >= 10 && (
            <View style={styles.warningCallout}>
              <Text style={styles.warningCalloutText}>
                {latestResult.score >= 13
                  ? '你的评分较高，建议尽快寻求专业心理帮助。可以联系：心理援助热线 400-161-9995，或就近前往心理科就诊。'
                  : '评分处于临界范围。建议与家人沟通你的感受，注意休息和放松。可每隔 1-2 周再做一次测评关注变化。'}
              </Text>
            </View>
          )}

          {/* 趋势图（有历史记录时） */}
          {records.length > 0 && <MoodTrendChart records={records} />}

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setMode('idle')} activeOpacity={0.7}>
              <Text style={styles.actionBtnText}>返回</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={startQuiz} activeOpacity={0.7}>
              <Text style={styles.actionBtnTextPrimary}>再做一次</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── 空闲/首页模式 ──
  const hasConfig = !!config;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {/* 配置: 设置称呼 */}
      {!hasConfig && (
        <View style={styles.configCard}>
          <Text style={styles.configLabel}>给自己取个称呼</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="如：小明爸爸"
              placeholderTextColor={colors.muted}
              maxLength={20}
            />
            <TouchableOpacity
              style={[styles.saveBtn, !nameInput.trim() && { backgroundColor: colors.border }]}
              onPress={saveName}
              disabled={!nameInput.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>好的</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {hasConfig && (
        <View style={styles.configCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="happy-outline" size={20} color={colors.accent} />
            <Text style={styles.configLabel}>你好，{config.name}</Text>
          </View>
          <Text style={styles.configNote}>定期做情绪测评，关注自己的心理健康</Text>
        </View>
      )}

      {/* 最近测评概览 */}
      {lastRecord && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="analytics-outline" size={18} color={colors.accent} />
            <Text style={styles.summaryLabel}>最近测评</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
            <Text style={styles.summaryScore}>{lastRecord.score}</Text>
            <Text style={styles.summaryUnit}>/ 30</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm }}>
            <Text style={styles.summaryLabel}>
              {(() => {
                const interp = getInterpretation(lastRecord.score, colors);
                return interp.level;
              })()}
              {' · '}
              {lastRecord.date}
            </Text>
            {scoreTrend && (
              <View style={styles.summaryTrend}>
                <Ionicons
                  name={scoreTrend.direction === 'down' ? 'trending-down' : scoreTrend.direction === 'up' ? 'trending-up' : 'remove'}
                  size={14}
                  color={scoreTrend.direction === 'down' ? colors.success : scoreTrend.direction === 'up' ? colors.error : colors.muted}
                />
                <Text style={{ ...typography.caption1, color: colors.muted }}>
                  {scoreTrend.direction === 'down' ? `降了${scoreTrend.diff}分` : scoreTrend.direction === 'up' ? `升了${scoreTrend.diff}分` : '持平'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 开始测评 */}
      <TouchableOpacity style={styles.startBtn} onPress={startQuiz} activeOpacity={0.7}>
        <Ionicons name="document-text-outline" size={20} color="#fff" />
        <Text style={styles.startBtnText}>
          {lastRecord ? '再做一次测评' : '开始第一次测评'}
        </Text>
      </TouchableOpacity>

      {/* 历史记录 */}
      {records.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>历史记录</Text>
          <MoodTrendChart records={records} />
          <View style={[styles.historyTable, { marginTop: spacing.sm }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyHeaderText, { flex: 2 }]}>日期</Text>
              <Text style={[styles.historyHeaderText, { flex: 1.5 }]}>分数</Text>
              <Text style={[styles.historyHeaderText, { flex: 2.5 }]}>状态</Text>
              <Text style={[styles.historyHeaderText, { flex: 1.5 }]}>操作</Text>
            </View>
            {[...records].reverse().map((r, i) => {
              const origIdx = records.length - 1 - i;
              const interp = getInterpretation(r.score, colors);
              const scoreColor = r.score >= 13 ? colors.error : r.score >= 10 ? colors.warning : colors.success;
              return (
                <View key={r.id} style={styles.historyItem}>
                  <View style={[styles.historyCell, { flex: 2 }]}>
                    <Text style={styles.historyText}>{r.date.slice(5)}</Text>
                  </View>
                  <View style={[styles.historyCell, { flex: 1.5 }]}>
                    <Text style={[styles.historyText, { color: scoreColor, fontWeight: '700' }]}>{r.score}</Text>
                  </View>
                  <View style={[styles.historyCell, { flex: 2.5 }]}>
                    <Text style={[styles.historyText, { color: scoreColor, fontSize: 12 }]}>{interp.level}</Text>
                  </View>
                  <View style={[styles.historyCell, { flex: 1.5 }]}>
                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => {
                        const doDel = () => {
                          const newRecords = records.filter((_, j) => j !== origIdx);
                          setRecords(newRecords);
                          persistRecords(newRecords);
                        };
                        if (Platform.OS === 'web') {
                          if (window.confirm('确定删除这条记录吗？')) doDel();
                        } else {
                          Alert.alert('删除记录', '确定删除这条记录吗？', [
                            { text: '取消', style: 'cancel' },
                            { text: '删除', style: 'destructive', onPress: doDel },
                          ]);
                        }
                      }}
                    >
                      <Text style={styles.delBtnText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 空状态 */}
      {!lastRecord && (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={36} color={colors.muted} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>照顾好自己，才能更好地照顾家人</Text>
          <Text style={[styles.emptyText, { marginTop: 4 }]}>点击上方按钮开始第一次测评</Text>
        </View>
      )}
    </ScrollView>
  );
}

export default MoodCheckIn;
