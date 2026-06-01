import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GrowthDataPoint, BOY_GROWTH, GIRL_GROWTH } from '../../lib/growth-chart-data';
import { colors, spacing, typography } from '../../styles/tokens';

const CHART_W = 300;
const PANEL_H = 130;
const TOTAL_H = PANEL_H * 2 + 24;
const PAD_L = 32;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 4;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = PANEL_H - PAD_T - PAD_B;

interface Record { month: number; height: number; weight: number; }
interface Props { gender: 'boy' | 'girl'; records: Record[]; }

function interp(data: GrowthDataPoint[], month: number, key: keyof GrowthDataPoint): number {
  if (month <= data[0].month) return data[0][key];
  if (month >= data[data.length - 1].month) return data[data.length - 1][key];
  for (let i = 0; i < data.length - 1; i++) {
    if (month >= data[i].month && month <= data[i + 1].month) {
      const t = (month - data[i].month) / (data[i + 1].month - data[i].month);
      return data[i][key] + (data[i + 1][key] - data[i][key]) * t;
    }
  }
  return data[data.length - 1][key];
}

function ChartPanel({
  data, yMin, yMax, yStep, unit, colorP, colorM, band1, band2, records, top,
}: {
  data: GrowthDataPoint[];
  yMin: number; yMax: number; yStep: number;
  unit: string; colorP: string; colorM: string;
  band1: string; band2: string;
  records: { month: number; value: number }[];
  top: number;
}) {
  const x = (m: number) => PAD_L + (m / 36) * PLOT_W;
  const y = (v: number) => top + PAD_T + ((yMax - v) / (yMax - yMin)) * PLOT_H;

  // 色带 + 网格线 + Y 标签一次性生成
  const elements: React.ReactElement[] = [];

  // 色带 — 用竖条拼
  for (let i = 0; i <= 72; i++) {
    const m = (i / 72) * 36;
    const cx = x(m);
    const p3 = y(interp(data, m, 'p3'));
    const p15 = y(interp(data, m, 'p15'));
    const p85 = y(interp(data, m, 'p85'));
    const p97 = y(interp(data, m, 'p97'));
    elements.push(
      <React.Fragment key={`b-${i}`}>
        <View style={[s.bar, { left: cx, top: p3, height: Math.max(1, p15 - p3), backgroundColor: band1 }]} />
        <View style={[s.bar, { left: cx, top: p15, height: Math.max(1, p85 - p15), backgroundColor: band2 }]} />
        <View style={[s.bar, { left: cx, top: p85, height: Math.max(1, p97 - p85), backgroundColor: band1 }]} />
      </React.Fragment>
    );
  }

  // 网格线 + Y 标签
  const yCount = Math.floor((yMax - yMin) / yStep);
  for (let i = 0; i <= yCount; i++) {
    const val = yMin + i * yStep;
    const yy = y(val);
    elements.push(
      <React.Fragment key={`g-${i}`}>
        <View style={[s.grid, { top: yy, left: PAD_L, width: PLOT_W }]} />
        <Text style={[s.yLbl, { top: yy - 5 }]}>{val}</Text>
      </React.Fragment>
    );
  }

  // 曲线采样点（每 0.5 月）
  const pts = (key: keyof GrowthDataPoint): { x: number; y: number }[] => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i <= 72; i++) {
      const m = (i / 72) * 36;
      out.push({ x: x(m), y: y(interp(data, m, key)) });
    }
    return out;
  };

  const curveP3 = pts('p3');
  const curveP50 = pts('p50');
  const curveP97 = pts('p97');

  // 曲线点
  for (let i = 0; i < curveP97.length; i++) {
    elements.push(<View key={`p97-${i}`} style={[s.dot, { left: curveP97[i].x, top: curveP97[i].y - 0.75, width: 1.5, height: 1.5, borderRadius: 0.75, backgroundColor: colorP }]} />);
  }
  for (let i = 0; i < curveP50.length; i++) {
    elements.push(<View key={`p50-${i}`} style={[s.dot, { left: curveP50[i].x, top: curveP50[i].y - 1, width: 2, height: 2, borderRadius: 1, backgroundColor: colorM }]} />);
  }
  for (let i = 0; i < curveP3.length; i++) {
    elements.push(<View key={`p3-${i}`} style={[s.dot, { left: curveP3[i].x, top: curveP3[i].y - 0.75, width: 1.5, height: 1.5, borderRadius: 0.75, backgroundColor: colorP }]} />);
  }

  // 数据点
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const px = x(r.month);
    const py = y(r.value);
    if (isNaN(py) || py < top || py > top + PANEL_H) continue;
    const v15 = interp(data, r.month, 'p15');
    const v85 = interp(data, r.month, 'p85');
    const dc = (r.value < v15 || r.value > v85) ? colorP : colorM;
    elements.push(<View key={`d-${i}`} style={[s.dataPt, { left: px - 4, top: py - 4, backgroundColor: dc }]} />);
  }

  // 单位标签
  elements.push(<Text key="unit" style={[s.unit, { top: top + 2, left: PAD_L - 2 }]}>{unit}</Text>);

  return <>{elements}</>;
}

export function GrowthChart({ gender, records }: Props) {
  const lenData = (gender === 'boy' ? BOY_GROWTH : GIRL_GROWTH).length;
  const wtData = (gender === 'boy' ? BOY_GROWTH : GIRL_GROWTH).weight;

  const lv = lenData.flatMap(d => [d.p3, d.p97]);
  const lenMin = Math.floor(Math.min(...lv) / 5) * 5;
  const lenMax = Math.ceil(Math.max(...lv) / 5) * 5;

  const wv = wtData.flatMap(d => [d.p3, d.p97]);
  const wtMin = 0;
  const wtMax = Math.ceil(Math.max(...wv) / 2) * 2;

  const xFn = (m: number) => PAD_L + (m / 36) * PLOT_W;

  return (
    <View style={s.wrapper}>
      <Text style={s.title}>生长曲线</Text>
      <View style={{ width: CHART_W, height: TOTAL_H }}>
        {/* 背景 */}
        <View style={{ position: 'absolute', left: 0, top: 0, width: CHART_W, height: TOTAL_H, backgroundColor: '#FCFAF5', borderRadius: 8 }} />

        {/* 上半：身长 */}
        <ChartPanel data={lenData} yMin={lenMin} yMax={lenMax} yStep={5} unit="cm" colorP="#D06060" colorM="#CC4444" band1="#FFE0E0" band2="#E8FFE8" records={records.map(r => ({ month: r.month, value: r.height }))} top={0} />

        {/* 分隔线 */}
        <View style={{ position: 'absolute', left: PAD_L, top: PANEL_H + 1, width: PLOT_W, height: 0.5, backgroundColor: colors.border }} />

        {/* 下半：体重 */}
        <ChartPanel data={wtData} yMin={wtMin} yMax={wtMax} yStep={2} unit="kg" colorP="#6080C0" colorM="#4466CC" band1="#E0ECFF" band2="#E8FFF0" records={records.map(r => ({ month: r.month, value: r.weight }))} top={PANEL_H + 2} />

        {/* X 轴刻度 */}
        {[0, 6, 12, 18, 24, 30, 36].map(m => (
          <Text key={m} style={[s.xLbl, { left: xFn(m) - 6, top: TOTAL_H - 14 }]}>{m}</Text>
        ))}
        <Text style={[s.xLbl, { left: CHART_W / 2 - 10, top: TOTAL_H - 14, fontWeight: '600' }]}>月龄</Text>
      </View>

      {/* 图例 */}
      <View style={s.legend}>
        <View style={s.legIt}><View style={[s.legDot, { backgroundColor: '#CC4444' }]} /><Text style={s.legTxt}>身长</Text></View>
        <View style={s.legIt}><View style={[s.legDot, { backgroundColor: '#4466CC' }]} /><Text style={s.legTxt}>体重</Text></View>
        <View style={s.legIt}><View style={[s.legDot, { backgroundColor: '#666', width: 8, height: 8, borderRadius: 4 }]} /><Text style={s.legTxt}>记录</Text></View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { alignItems: 'center', marginVertical: spacing.sm },
  title: { ...typography.caption1, fontWeight: '600', color: colors.fgSecondary, marginBottom: spacing.xs },
  bar: { position: 'absolute', opacity: 0.35 },
  grid: { position: 'absolute', height: 0.5, backgroundColor: '#E8E4D9' },
  yLbl: { position: 'absolute', left: 2, fontSize: 8, color: '#8A8A9A', width: 26, textAlign: 'right' },
  xLbl: { position: 'absolute', fontSize: 8, color: '#8A8A9A', width: 12, textAlign: 'center' },
  unit: { position: 'absolute', fontSize: 8, fontWeight: '600', color: '#666' },
  dot: { position: 'absolute', opacity: 0.7 },
  dataPt: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legIt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legDot: { width: 10, height: 10, borderRadius: 5 },
  legTxt: { ...typography.caption2, color: colors.muted },
});

export default GrowthChart;
