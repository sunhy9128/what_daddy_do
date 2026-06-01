import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GrowthDataPoint, BOY_GROWTH, GIRL_GROWTH } from '../../lib/growth-chart-data';
import { colors, spacing, typography } from '../../styles/tokens';

// 上下分栏：上半身长，下半体重，共享 X 轴
const W = 300;
const HALF_H = 120;
const H = HALF_H * 2 + 4;
const PAD = { top: 16, right: 8, bottom: 6, left: 30 };
const PW = W - PAD.left - PAD.right;
const PH = HALF_H - PAD.top - PAD.bottom;

interface Record {
  month: number;
  height: number;
  weight: number;
}

interface Props {
  gender: 'boy' | 'girl';
  records: Record[];
}

function interpolate(data: GrowthDataPoint[], month: number, key: keyof GrowthDataPoint): number {
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

function buildCurve(data: GrowthDataPoint[], key: keyof GrowthDataPoint, xFn: (m: number) => number, yFn: (v: number) => number) {
  const steps = 72;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const m = (i / steps) * 36;
    pts.push({ x: xFn(m), y: yFn(interpolate(data, m, key)) });
  }
  return pts;
}

function lineDots(points: { x: number; y: number }[], color: string, w: number) {
  return points.map((p, i) => (
    <View key={i} style={[styles.lineDot, { left: p.x, top: p.y - w / 2, width: w, height: w, backgroundColor: color, borderRadius: w / 2 }]} />
  ));
}

function renderHalf(
  data: GrowthDataPoint[],
  yMin: number,
  yMax: number,
  yStep: number,
  unit: string,
  colorP: string,
  colorMid: string,
  colorBand1: string,
  colorBand2: string,
  records: { month: number; value: number }[],
  yOffset: number,
) {
  const x = (m: number) => PAD.left + (m / 36) * PW;
  const yFn = (v: number) => yOffset + PAD.top + ((yMax - v) / (yMax - yMin)) * PH;

  // 色带
  const bands: React.ReactElement[] = [];
  for (let i = 0; i <= 72; i++) {
    const m = (i / 72) * 36;
    const cx = x(m);
    const p3 = yFn(interpolate(data, m, 'p3'));
    const p15 = yFn(interpolate(data, m, 'p15'));
    const p85 = yFn(interpolate(data, m, 'p85'));
    const p97 = yFn(interpolate(data, m, 'p97'));
    bands.push(
      <React.Fragment key={`b-${yOffset}-${i}`}>
        <View style={[styles.band, { left: cx, top: p3, height: Math.max(1, p15 - p3), backgroundColor: colorBand1, width: 3 }]} />
        <View style={[styles.band, { left: cx, top: p15, height: Math.max(1, p85 - p15), backgroundColor: colorBand2, width: 3 }]} />
        <View style={[styles.band, { left: cx, top: p85, height: Math.max(1, p97 - p85), backgroundColor: colorBand1, width: 3 }]} />
      </React.Fragment>
    );
  }

  const curveP3 = buildCurve(data, 'p3', x, yFn);
  const curveP50 = buildCurve(data, 'p50', x, yFn);
  const curveP97 = buildCurve(data, 'p97', x, yFn);

  return (
    <View style={{ position: 'absolute', left: 0, top: yOffset, width: W, height: HALF_H }}>
      {bands}

      {/* 网格线 */}
      {Array.from({ length: Math.floor((yMax - yMin) / yStep) + 1 }, (_, i) => {
        const val = yMin + i * yStep;
        const yy = yFn(val);
        return <View key={`g-${yOffset}-${i}`} style={[styles.gridLine, { top: yy, left: PAD.left, width: PW }]} />;
      })}

      {/* Y 轴标签 */}
      {Array.from({ length: Math.floor((yMax - yMin) / yStep) + 1 }, (_, i) => {
        const val = yMin + i * yStep;
        return (
          <Text key={`yl-${yOffset}-${i}`} style={[styles.yLabel, { top: yFn(val) - 5 }]}>
            {val}
          </Text>
        );
      })}

      {/* 曲线 */}
      {lineDots(curveP97, colorP, 1.5)}
      {lineDots(curveP50, colorMid, 2)}
      {lineDots(curveP3, colorP, 1.5)}

      {/* 单位 */}
      <Text style={[styles.axisUnit, { left: PAD.left - 4, top: yOffset + 2 }]}>{unit}</Text>

      {/* 数据点 */}
      {records.map((r, i) => {
        const px = x(r.month), py = yFn(r.value);
        const v15 = interpolate(data, r.month, 'p15');
        const v85 = interpolate(data, r.month, 'p85');
        const dotColor = (r.value < v15 || r.value > v85) ? colorP : colorMid;
        return <View key={i} style={[styles.dataDot, { left: px - 4, top: py - 4, backgroundColor: dotColor }]} />;
      })}
    </View>
  );
}

export function GrowthChart({ gender, records }: Props) {
  const lengthData = (gender === 'boy' ? BOY_GROWTH : GIRL_GROWTH).length;
  const weightData = (gender === 'boy' ? BOY_GROWTH : GIRL_GROWTH).weight;

  const lenVals = lengthData.flatMap(d => [d.p3, d.p97]);
  const lenMin = Math.floor(Math.min(...lenVals) / 5) * 5;
  const lenMax = Math.ceil(Math.max(...lenVals) / 5) * 5;

  const wtVals = weightData.flatMap(d => [d.p3, d.p97]);
  const wtMin = 0;
  const wtMax = Math.ceil(Math.max(...wtVals) / 2) * 2;

  const xFn = (m: number) => PAD.left + (m / 36) * PW;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>生长曲线</Text>

      <View style={{ width: W, height: H, backgroundColor: '#FCFAF5', borderRadius: 8, overflow: 'hidden' }}>
        {/* 上下半区分隔线 */}
        <View style={{ position: 'absolute', left: PAD.left, top: HALF_H, width: PW, height: 0.5, backgroundColor: colors.border }} />

        {/* X 轴 — 放在底部（在上下半区下方） */}
        <View style={{ position: 'absolute', left: 0, top: H - 16, width: W, height: 16 }}>
          {[0, 6, 12, 18, 24, 30, 36].map(m => (
            <Text key={m} style={[styles.xLabel, { left: xFn(m) - 6 }]}>{m}</Text>
          ))}
        </View>
        <Text style={[styles.xTitle, { left: W / 2 - 10, top: H - 14 }]}>月龄</Text>

        {/* 上半：身长 */}
        {renderHalf(lengthData, lenMin, lenMax, 5, 'cm', '#D06060', '#CC4444', '#FFE0E0', '#E8FFE8',
          records.map(r => ({ month: r.month, value: r.height })), 0)}

        {/* 下半：体重 */}
        {renderHalf(weightData, wtMin, wtMax, 2, 'kg', '#6080C0', '#4466CC', '#E0ECFF', '#E8FFF0',
          records.map(r => ({ month: r.month, value: r.weight })), HALF_H + 2)}
      </View>

      {/* 图例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#D06060' }]} /><Text style={styles.legendText}>身长 P3/P97</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#CC4444' }]} /><Text style={styles.legendText}>P50</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#6080C0' }]} /><Text style={styles.legendText}>体重 P3/P97</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#4466CC' }]} /><Text style={styles.legendText}>P50</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.sm },
  title: { ...typography.caption1, fontWeight: '600', color: colors.fgSecondary, marginBottom: spacing.xs },
  band: { position: 'absolute', opacity: 0.35 },
  gridLine: { position: 'absolute', height: 0.5, backgroundColor: '#E8E4D9' },
  yLabel: { position: 'absolute', left: 2, fontSize: 8, color: '#8A8A9A', width: 24, textAlign: 'right' },
  xLabel: { position: 'absolute', fontSize: 8, color: '#8A8A9A', width: 12, textAlign: 'center' },
  xTitle: { position: 'absolute', fontSize: 7, color: '#8A8A9A' },
  axisUnit: { position: 'absolute', fontSize: 8, fontWeight: '600', color: '#666' },
  lineDot: { position: 'absolute', opacity: 0.7 },
  dataDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  legend: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption2, color: colors.muted },
});

export default GrowthChart;
