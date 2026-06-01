import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { getVaccines, getUserVaccinations } from '../../lib/api';
import { Vaccine, VaccineDose, UserVaccination } from '../../lib/supabase';
import { colors, spacing, typography } from '../../styles/tokens';
import { LoadingDot } from './ToolBase';

const CHART_W = 260;
const PERIODS = [
  { label: '0-6月', start: 0, end: 6 },
  { label: '6-12月', start: 6, end: 12 },
  { label: '12-18月', start: 12, end: 18 },
  { label: '18-24月', start: 18, end: 24 },
  { label: '24-36月', start: 24, end: 36 },
];

export function VaccineCalendar({ userId }: { userId: string; babyGender?: string }) {
  const [vaccines, setVaccines] = useState<(Vaccine & { doses: VaccineDose[] })[]>([]);
  const [userVax, setUserVax] = useState<Map<number, UserVaccination>>(new Map());
  const [periodIndex, setPeriodIndex] = useState(0);
  const [showFree, setShowFree] = useState(true);
  const [showPaid, setShowPaid] = useState(true);
  const [showDone, setShowDone] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const [vaxList, userVaxList] = await Promise.all([
          getVaccines(),
          getUserVaccinations(userId),
        ]);
        setVaccines(vaxList);
        const map = new Map<number, UserVaccination>();
        userVaxList.forEach(v => map.set(v.dose_id, v));
        setUserVax(map);
      } catch (err) {
        console.error('Failed to load vaccine data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const period = PERIODS[periodIndex];
  const periodDoses = useMemo(() => {
    if (!period) return [];
    return vaccines.flatMap(vax =>
      vax.doses
        .filter(d => d.min_age_months < period.end && (!d.max_age_months || d.max_age_months > period.start))
        .map(d => ({ vax, dose: d, isDone: userVax.get(d.id)?.is_vaccinated || false }))
    ).sort((a, b) => a.vax.id - b.vax.id);
  }, [vaccines, userVax, period]);

  const groupedByVax = useMemo(() => {
    const map = new Map<number, { vax: Vaccine; doses: { dose: VaccineDose; isDone: boolean }[] }>();
    periodDoses.forEach(({ vax, dose, isDone }) => {
      if (!map.has(vax.id)) map.set(vax.id, { vax, doses: [] });
      map.get(vax.id)!.doses.push({ dose, isDone });
    });
    return Array.from(map.values());
  }, [periodDoses]);

  const filteredGroups = useMemo(() => {
    return groupedByVax
      .map(({ vax, doses }) => ({
        vax,
        doses: doses.filter(({ dose, isDone }) => {
          if (isDone) return showDone;
          return vax.category === '免费' ? showFree : showPaid;
        }),
      }))
      .filter(g => g.doses.length > 0);
  }, [groupedByVax, showFree, showPaid, showDone]);

  const barColor = (cat: string) => cat === '免费' ? '#4D96FF' : '#FF8E53';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {/* 时间段切换 */}
      <View style={styles.periodRow}>
        {PERIODS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.periodBtn, i === periodIndex && styles.periodBtnActive]}
            onPress={() => setPeriodIndex(i)}
          >
            <Text style={[styles.periodText, i === periodIndex && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.periodTitle}>{period?.label} 可接种疫苗</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <LoadingDot delay={0} />
            <LoadingDot delay={150} />
            <LoadingDot delay={300} />
          </View>
          <Text style={styles.loadingText}>正在加载疫苗数据…</Text>
        </View>
      ) : (
        /* 图表区域 — 支持水平滚动 */
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.hScroll}>
          <View style={styles.chartColumn}>
            {/* X轴 */}
            <View style={styles.xAxis}>
              {Array.from({ length: Math.ceil((period?.end || 6) / 2) + 1 }, (_, i) => {
                const m = (period?.start || 0) + i * 2;
                if (m > (period?.end || 6)) return null;
                return <Text key={m} style={[styles.xLabel, { left: ((m - (period?.start || 0)) / ((period?.end || 6) - (period?.start || 0))) * CHART_W }]}>{m}月</Text>;
              })}
            </View>

            {/* 疫苗时间线 */}
            <ScrollView style={styles.chartScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <View style={styles.chartArea}>
              {filteredGroups.length > 0 ? filteredGroups.map(({ vax, doses }) => (
                <View key={vax.id} style={styles.vaxRow}>
                  <Text style={styles.vaxName} numberOfLines={1}>{vax.name}</Text>
                  <View style={styles.barArea}>
                    {/* 每行自带的竖向分割线 */}
                    {period && Array.from({ length: Math.ceil((period.end - period.start) / 2) + 1 }, (_, i) => {
                      const m = period.start + i * 2;
                      if (m > period.end) return null;
                      const left = ((m - period.start) / (period.end - period.start)) * CHART_W;
                      return <View key={m} style={[styles.vLine, { left }]} />;
                    })}
                    {doses.map(({ dose, isDone }) => {
                      const span = (period?.end || 6) - (period?.start || 0);
                      const startM = Math.max(dose.min_age_months, period?.start || 0);
                      const endM = Math.min(dose.max_age_months || 99, period?.end || 6);
                      const left = ((startM - (period?.start || 0)) / span) * CHART_W;
                      const w = Math.max(6, ((endM - startM) / span) * CHART_W);
                      return (
                        <View key={dose.id} style={[styles.bar, {
                          left, width: w, top: 4,
                          backgroundColor: isDone ? '#6BCB77' : barColor(vax.category),
                          opacity: isDone ? 0.6 : 1,
                        }]}>
                          <Text style={styles.barLabel}>{isDone ? '✓' : `${dose.dose_number}`}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )) : <Text style={styles.emptyText}>该时间段内无疫苗</Text>}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* 图例 */}
      <View style={styles.legend}>
        <TouchableOpacity style={styles.legendItem} onPress={() => setShowFree(!showFree)}>
          <View style={[styles.swatch, { backgroundColor: '#4D96FF', opacity: showFree ? 1 : 0.3 }]} />
          <Text style={[styles.legendText, showFree ? {} : styles.legendOff]}>免费</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legendItem} onPress={() => setShowPaid(!showPaid)}>
          <View style={[styles.swatch, { backgroundColor: '#FF8E53', opacity: showPaid ? 1 : 0.3 }]} />
          <Text style={[styles.legendText, showPaid ? {} : styles.legendOff]}>自费</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legendItem} onPress={() => setShowDone(!showDone)}>
          <View style={[styles.swatch, { backgroundColor: '#6BCB77', opacity: showDone ? 1 : 0.3 }]} />
          <Text style={[styles.legendText, showDone ? {} : styles.legendOff]}>已接种</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 540 },
  hScroll: { flex: 1 },
  chartColumn: { minWidth: 322 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  periodBtn: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  periodBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  periodText: { ...typography.caption1, color: colors.muted, fontWeight: '500' },
  periodTextActive: { color: '#fff' },
  periodTitle: { ...typography.caption2, fontWeight: '600', color: colors.muted, marginBottom: 4, textTransform: 'uppercase' },
  xAxis: { height: 18, position: 'relative', marginBottom: spacing.xs, marginLeft: 62, width: CHART_W },
  xLabel: { position: 'absolute', fontSize: 8, color: '#8A8A9A', textAlign: 'center', width: 20, marginLeft: -10 },
  chartScroll: { height: 300 },
  chartArea: { position: 'relative' },
  vLine: { position: 'absolute', top: 0, bottom: 0, width: 0.5, backgroundColor: '#E8E4D9' },
  emptyText: { ...typography.footnote, color: colors.muted, textAlign: 'center', paddingVertical: spacing.md },
  vaxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, minHeight: 28 },
  vaxName: { width: 62, fontSize: 10, color: colors.fgSecondary, paddingRight: 4, fontWeight: '500' },
  barArea: { width: CHART_W, height: 28, minHeight: 28, position: 'relative', backgroundColor: colors.surfaceSecondary + '60', borderRadius: 6 },
  gridBg: { position: 'absolute', left: 6, top: 13, right: 6, height: 1, backgroundColor: colors.border },
  bar: { position: 'absolute', top: 4, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  barLabel: { fontSize: 10, color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { ...typography.caption1, color: colors.muted },
  legendOff: { textDecorationLine: 'line-through', opacity: 0.5 },
  // 加载动画
  loadingContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary + '40',
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  loadingText: { ...typography.footnote, color: colors.muted },
});

export default VaccineCalendar;
