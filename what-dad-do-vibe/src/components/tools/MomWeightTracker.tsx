import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography, shadows } from '../../styles/tokens';
import {
  loadMomWeightRecords, saveMomWeightRecords, MomWeightRecord,
  loadMomWeightConfig, MomWeightConfig,
} from '../../lib/storage';
import { LoadingDot } from './ToolBase';
import Svg, { Path, Line, Rect, Circle, Text as SvgText, G } from 'react-native-svg';

// IOM 推荐增重范围
function getIOMRange(bmi: number): { totalMin: number; totalMax: number; firstTri: number; weekly: number } {
  if (bmi < 18.5) return { totalMin: 12.5, totalMax: 18, firstTri: 2, weekly: 0.5 };
  if (bmi < 25) return { totalMin: 11.5, totalMax: 16, firstTri: 2, weekly: 0.4 };
  if (bmi < 30) return { totalMin: 7, totalMax: 11.5, firstTri: 1.25, weekly: 0.3 };
  return { totalMin: 5, totalMax: 9, firstTri: 1.25, weekly: 0.25 };
}

// 获取某孕周的推荐增重范围（下限/上限）
function getRecommendedGain(week: number, bmi: number): { min: number; max: number } {
  const range = getIOMRange(bmi);
  if (week <= 0) return { min: 0, max: 0 };
  if (week <= 12) {
    const ratio = week / 12;
    return { min: ratio * range.firstTri * 0.7, max: ratio * range.firstTri * 1.3 };
  }
  const after12 = week - 12;
  const firstTriMin = range.firstTri * 0.7;
  const firstTriMax = range.firstTri * 1.3;
  return {
    min: firstTriMin + after12 * range.weekly * 0.85,
    max: firstTriMax + after12 * range.weekly * 1.15,
  };
}

function MomWeightChart({ records, bmi, prePregnancyWeight }: { records: MomWeightRecord[]; bmi: number; prePregnancyWeight: number }) {
  const colors = useColors();
  const CHART_H = 140;
  const CHART_W = 260;
  const PAD_L = 28;
  const PAD_R = 6;
  const PLOT_W = CHART_W - PAD_L - PAD_R;

  const maxWeek = Math.max(40, ...records.map(r => r.week));
  const maxGain = Math.max(
    20,
    ...records.map(r => r.weight - prePregnancyWeight),
    getRecommendedGain(maxWeek, bmi).max + 2,
  );

  const toX = (week: number) => PAD_L + (week / maxWeek) * PLOT_W;
  const toY = (gain: number) => CHART_H - (gain / maxGain) * CHART_H;

  // 推荐范围带：闭合 Path（从 week 0 沿上界到 maxWeek，再沿下界返回）
  const bandPath = useMemo(() => {
    const upper: string[] = [];
    const lower: string[] = [];
    for (let w = 0; w <= maxWeek; w++) {
      const { min, max } = getRecommendedGain(w, bmi);
      upper.push(`${toX(w).toFixed(1)},${toY(max).toFixed(1)}`);
      lower.unshift(`${toX(w).toFixed(1)},${toY(min).toFixed(1)}`);
    }
    return 'M ' + [...upper, ...lower].join(' L ') + ' Z';
  }, [maxWeek, bmi]);

  // Y 轴网格值
  const yTicks: number[] = [];
  for (let v = 0; v <= maxGain; v += 5) yTicks.push(v);

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadows.sm }}>
      <Text style={{ ...typography.caption1, fontWeight: '600', color: colors.fgSecondary, marginBottom: spacing.sm }}>
        体重增长曲线
      </Text>
      <View style={{ height: CHART_H + 28, position: 'relative' }}>
        <Svg width={CHART_W} height={CHART_H + 28}>
          {/* Y 轴网格 */}
          {yTicks.map(v => (
            <G key={v}>
              <Line
                x1={PAD_L} y1={toY(v)}
                x2={CHART_W - PAD_R} y2={toY(v)}
                stroke={colors.divider}
                strokeWidth={0.5}
              />
              <SvgText
                x={PAD_L - 4} y={toY(v) + 3}
                fontSize={8} fill={colors.muted}
                textAnchor="end"
              >
                {v}
              </SvgText>
            </G>
          ))}

          {/* 推荐范围带 */}
          <Path d={bandPath} fill={colors.accent} fillOpacity={0.12} />

          {/* 4 周间隔的垂直范围条 */}
          {Array.from({ length: Math.ceil(maxWeek / 4) + 1 }, (_, i) => {
            const week = i * 4;
            if (week > maxWeek) return null;
            const { min, max } = getRecommendedGain(week, bmi);
            return (
              <Rect
                key={week}
                x={toX(week) - 3} y={toY(max)}
                width={6} height={Math.max(2, toY(min) - toY(max))}
                rx={2} fill={colors.accent} fillOpacity={0.18}
              />
            );
          })}

          {/* 2 周间隔的参考标记线 */}
          {Array.from({ length: Math.ceil(maxWeek / 2) + 1 }, (_, i) => {
            const week = i * 2;
            if (week > maxWeek) return null;
            const { min, max } = getRecommendedGain(week, bmi);
            return (
              <G key={week}>
                <Rect x={toX(week)} y={toY(max)} width={3} height={2} fill={colors.accent} fillOpacity={0.5} />
                <Rect x={toX(week)} y={toY(min)} width={3} height={2} fill={colors.accent} fillOpacity={0.35} />
              </G>
            );
          })}

          {/* 用户数据点 */}
          {records.map((r, i) => {
            const gain = r.weight - prePregnancyWeight;
            if (gain <= 0) return null;
            const { min, max } = getRecommendedGain(r.week, bmi);
            const inRange = gain >= min && gain <= max;
            return (
              <Circle
                key={i}
                cx={toX(r.week)} cy={toY(gain)}
                r={4}
                fill={inRange ? colors.success : colors.error}
                stroke={colors.surface}
                strokeWidth={1.5}
              />
            );
          })}

          {/* X 轴标签（每 10 周） */}
          {Array.from({ length: Math.ceil(maxWeek / 10) + 1 }, (_, i) => {
            const week = i * 10;
            if (week > maxWeek) return null;
            return (
              <SvgText
                key={week}
                x={toX(week)} y={CHART_H + 14}
                fontSize={9} fill={colors.muted}
                textAnchor="middle"
              >
                {week}周
              </SvgText>
            );
          })}

          {/* 单位 */}
          <SvgText
            x={0} y={8}
            fontSize={8} fill={colors.muted}
          >
            kg
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

export function MomWeightTracker({ userId, expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const [config, setConfig] = useState<MomWeightConfig | null>(null);
  const [records, setRecords] = useState<MomWeightRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 表单状态
  const [weekStr, setWeekStr] = useState('');
  const [weightStr, setWeightStr] = useState('');

  // 加载数据
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const [cfg, recs] = await Promise.all([
          loadMomWeightConfig(userId),
          loadMomWeightRecords(userId),
        ]);
        if (cfg) {
          setConfig(cfg);
        }
        setRecords(recs.sort((a, b) => a.week - b.week));
      } catch (e) {
        console.error('Failed to load mom weight data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persistRecords = useCallback((recs: MomWeightRecord[]) => {
    if (!userId) return;
    saveMomWeightRecords(userId, recs);
  }, [userId]);

  const bmi = useMemo(() => {
    if (!config || config.height <= 0) return 21;
    return config.prePregnancyWeight / ((config.height / 100) ** 2);
  }, [config]);

  const bmiLabel = useMemo(() => {
    if (!config) return '';
    if (bmi < 18.5) return '偏瘦';
    if (bmi < 25) return '正常';
    if (bmi < 30) return '偏胖';
    return '肥胖';
  }, [bmi, config]);

  const canAdd = useMemo(() => {
    const w = parseInt(weekStr, 10);
    const wt = parseFloat(weightStr);
    return !isNaN(w) && w >= 0 && w <= 42 && !isNaN(wt) && wt > 0;
  }, [weekStr, weightStr]);

  const handleAdd = () => {
    if (!canAdd) return;
    const w = parseInt(weekStr, 10);
    const wt = parseFloat(weightStr);
    const newRecord: MomWeightRecord = { week: w, weight: wt };
    const newRecords = [...records, newRecord].sort((a, b) => a.week - b.week);
    setRecords(newRecords);
    persistRecords(newRecords);
    setWeekStr('');
    setWeightStr('');
  };

  const handleDelete = (idx: number) => {
    const msg = `确定删除第 ${records[idx].week} 周的记录吗？`;
    const doDelete = () => {
      const newRecords = records.filter((_, i) => i !== idx);
      setRecords(newRecords);
      persistRecords(newRecords);
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
    container: { maxHeight: expanded ? undefined : 540 },
    configCard: {
      backgroundColor: colors.accentLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    configLabel: { ...typography.footnote, color: colors.fgSecondary, marginBottom: spacing.xs },
    configValue: { ...typography.callout, fontWeight: '600', color: colors.accent },
    configBtn: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    configBtnText: { ...typography.caption1, color: colors.accent, fontWeight: '500' },
  configNote: { ...typography.caption2, color: colors.muted, marginTop: spacing.xs },
    addSection: { marginBottom: spacing.lg },
    sectionTitle: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.fgSecondary,
      marginBottom: spacing.sm,
      letterSpacing: 0.5,
    },
    inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
    inputField: { flex: 1 },
    inputLabel: { ...typography.caption2, color: colors.fgSecondary, marginBottom: 4, fontWeight: '500' },
    input: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: 'center',
      height: 42,
    },
    addBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnDisabled: { backgroundColor: colors.surfaceSecondary },
    addBtnText: { ...typography.callout, fontWeight: '600', color: '#fff' },
    addBtnTextDisabled: { color: colors.muted },
    historySection: { marginTop: spacing.md },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    historyTitle: { ...typography.caption1, fontWeight: '600', color: colors.fgSecondary, letterSpacing: 0.5 },
    historyTable: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      ...shadows.sm,
    },
    historyHeader: {
      flexDirection: 'row',
      backgroundColor: colors.accentLight,
      paddingVertical: spacing.sm + 2,
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
      paddingVertical: spacing.sm + 2,
    },
    historyText: { ...typography.callout, color: colors.fg, textAlign: 'center', fontWeight: '500' },
    historyRange: { ...typography.caption2, color: colors.fgSecondary },
    historyGainOk: { color: colors.success },
    historyGainWarn: { color: colors.error },
    delBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    delBtnText: { ...typography.caption2, color: colors.error, fontWeight: '600' },
    emptyState: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    emptyText: { ...typography.footnote, color: colors.muted, fontWeight: '500' },
    // 配置弹窗
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, width: '100%', maxWidth: 360 },
    modalTitle: { ...typography.title3, fontWeight: '700', marginBottom: spacing.md },
    modalRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    modalField: { flex: 1 },
    modalLabel: { ...typography.caption1, color: colors.fgSecondary, marginBottom: spacing.xs },
    modalInput: {
      ...typography.callout,
      color: colors.fg,
      backgroundColor: colors.bg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.divider,
      textAlign: 'center',
      height: 42,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
    modalBtn: { backgroundColor: colors.accent, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
    modalBtnText: { ...typography.callout, fontWeight: '600', color: '#fff' },
    modalCancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
    modalCancelText: { ...typography.callout, color: colors.fgSecondary },
    loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
    loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    loadingText: { ...typography.footnote, color: colors.fgSecondary },
  }), [colors, expanded]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
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
          {/* 孕前配置卡 */}
          <View style={styles.configCard}>
            {config ? (
              <>
                <Text style={styles.configLabel}>孕前体重 · 身高</Text>
                <Text style={styles.configValue}>
                  {config.prePregnancyWeight}kg · {config.height}cm（BMI {bmi.toFixed(1)} · {bmiLabel}）
                </Text>
                <Text style={styles.configNote}>可在「个人资料」中修改</Text>
              </>
            ) : (
              <>
                <Text style={styles.configLabel}>请先设置孕前体重和身高</Text>
                <Text style={styles.configNote}>请在「个人资料」中设置</Text>
              </>
            )}
          </View>

          {/* 图表 */}
          {config && records.length > 0 && (
            <MomWeightChart records={records} bmi={bmi} prePregnancyWeight={config.prePregnancyWeight} />
          )}

          {/* 新增记录 */}
          {config && (
            <View style={styles.addSection}>
              <Text style={styles.sectionTitle}>新增记录</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>孕周</Text>
                  <TextInput style={styles.input} value={weekStr} onChangeText={setWeekStr} keyboardType="number-pad" placeholder="0-42" placeholderTextColor={colors.muted} maxLength={2} />
                </View>
                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>体重(kg)</Text>
                  <TextInput style={styles.input} value={weightStr} onChangeText={setWeightStr} keyboardType="decimal-pad" placeholder="当前体重" placeholderTextColor={colors.muted} />
                </View>
                <TouchableOpacity style={[styles.addBtn, !canAdd && styles.addBtnDisabled]} onPress={handleAdd} disabled={!canAdd}>
                  <Text style={[styles.addBtnText, !canAdd && styles.addBtnTextDisabled]}>记录</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 历史记录 */}
          {records.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyTitleRow}>
                <Text style={styles.historyTitle}>历史记录</Text>
              </View>
              <View style={styles.historyTable}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyHeaderText, { flex: 2 }]}>孕周</Text>
                  <Text style={[styles.historyHeaderText, { flex: 2.5 }]}>体重(kg)</Text>
                  <Text style={[styles.historyHeaderText, { flex: 2.5 }]}>增重(kg)</Text>
                  <Text style={[styles.historyHeaderText, { flex: 3 }]}>范围(kg)</Text>
                  <Text style={[styles.historyHeaderText, { flex: 2 }]}>操作</Text>
                </View>
                {[...records].reverse().map((r, i) => {
                  const origIdx = records.length - 1 - i;
                  const gain = +(r.weight - (config?.prePregnancyWeight || 0)).toFixed(2);
                  const { min, max } = bmi ? getRecommendedGain(r.week, bmi) : { min: 0, max: 0 };
                  const ok = gain >= min && gain <= max;
                  return (
                    <View key={i} style={styles.historyItem}>
                      <View style={[styles.historyCell, { flex: 2 }]}>
                        <Text style={styles.historyText}>{r.week}周</Text>
                      </View>
                      <View style={[styles.historyCell, { flex: 2.5 }]}>
                        <Text style={styles.historyText}>{r.weight.toFixed(1)}</Text>
                      </View>
                      <View style={[styles.historyCell, { flex: 2.5 }]}>
                        <Text style={[styles.historyText, ok ? styles.historyGainOk : styles.historyGainWarn]}>
                          {gain > 0 ? `+${gain.toFixed(2)}` : gain.toFixed(2)}
                        </Text>
                      </View>
                      <View style={[styles.historyCell, { flex: 3 }]}>
                        <Text style={styles.historyRange}>
                          {min.toFixed(2)}-{max.toFixed(2)}
                        </Text>
                      </View>
                      <View style={[styles.historyCell, { flex: 2 }]}>
                        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(origIdx)}>
                          <Text style={styles.delBtnText}>删除</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {!config && (
            <View style={styles.emptyState}>
              <Ionicons name="scale-outline" size={20} color={colors.muted} />
              <Text style={styles.emptyText}>请先设置孕前体重和身高</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

export default MomWeightTracker;

