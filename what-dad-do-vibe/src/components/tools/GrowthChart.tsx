import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GrowthDataPoint, BOY_GROWTH, GIRL_GROWTH } from '../../lib/growth-chart-data';
import { colors, spacing, typography } from '../../styles/tokens';

const W = 300, H = 200, PAD = { top: 18, right: 8, bottom: 28, left: 32 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

interface Props {
  gender: 'boy' | 'girl';
  metric: 'weight' | 'length';
  records: { month: number; value: number }[];
}

function findClosest(data: GrowthDataPoint[], month: number): GrowthDataPoint {
  let best = data[0], bestDiff = Math.abs(data[0].month - month);
  for (const d of data) {
    const diff = Math.abs(d.month - month);
    if (diff < bestDiff) { best = d; bestDiff = diff; }
  }
  return best;
}

// 线性插值
function interpolate(data: GrowthDataPoint[], month: number, key: keyof GrowthDataPoint): number {
  for (let i = 0; i < data.length - 1; i++) {
    if (month >= data[i].month && month <= data[i + 1].month) {
      const t = (month - data[i].month) / (data[i + 1].month - data[i].month);
      return data[i][key] + (data[i + 1][key] - data[i][key]) * t;
    }
  }
  return data[data.length - 1][key];
}

export function GrowthChart({ gender, metric, records }: Props) {
  const data = (gender === 'boy' ? BOY_GROWTH : GIRL_GROWTH)[metric];
  const allVals = data.flatMap(d => [d.p3, d.p97]);
  const yMin = Math.floor(Math.min(...allVals) / 5) * 5;
  const yMax = Math.ceil(Math.max(...allVals) / 5) * 5;

  const x = (m: number) => PAD.left + (m / 36) * PW;
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * PH;

  const unit = metric === 'weight' ? 'kg' : 'cm';
  const title = metric === 'weight' ? '体重' : '身长';

  // 生成曲线上的点集
  const steps = 72; // 每0.5月一个采样点
  const curveP3: { x: number; y: number }[] = [];
  const curveP50: { x: number; y: number }[] = [];
  const curveP97: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const m = (i / steps) * 36;
    curveP3.push({ x: x(m), y: y(interpolate(data, m, 'p3')) });
    curveP50.push({ x: x(m), y: y(interpolate(data, m, 'p50')) });
    curveP97.push({ x: x(m), y: y(interpolate(data, m, 'p97')) });
  }

  // 色带区域用 Polygon 近似 — 渲染为一系列竖线
  const colorBands = [];
  for (let i = 0; i <= steps; i++) {
    const m = (i / steps) * 36;
    const cx = x(m);
    const p3 = y(interpolate(data, m, 'p3'));
    const p15 = y(interpolate(data, m, 'p15'));
    const p85 = y(interpolate(data, m, 'p85'));
    const p97 = y(interpolate(data, m, 'p97'));
    colorBands.push(
      <React.Fragment key={i}>
        <View style={[styles.band, { left: cx, top: p3, height: p15 - p3, backgroundColor: '#FFE0E0', width: 3 }]} />
        <View style={[styles.band, { left: cx, top: p15, height: p85 - p15, backgroundColor: '#E8FFE8', width: 3 }]} />
        <View style={[styles.band, { left: cx, top: p85, height: p97 - p85, backgroundColor: '#FFE0E0', width: 3 }]} />
      </React.Fragment>
    );
  }

  // 曲线点连线 → 用小块拼
  const lineDots = (points: { x: number; y: number }[], color: string, w: number) =>
    points.map((p, i) => (
      <View key={i} style={[styles.lineDot, { left: p.x, top: p.y - w/2, width: w, height: w, backgroundColor: color, borderRadius: w/2 }]} />
    ));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}（{unit}）</Text>

      <View style={{ width: W, height: H }}>
        {/* 色带 */}
        {colorBands}

        {/* 网格线 + Y轴标签 */}
        {Array.from({ length: Math.floor((yMax - yMin) / 5) + 1 }, (_, i) => {
          const val = yMin + i * 5;
          const yy = y(val);
          return (
            <React.Fragment key={i}>
              <View style={[styles.gridLine, { top: yy, left: PAD.left, width: PW }]} />
              <Text style={[styles.yLabel, { top: yy - 6 }]}>{val}</Text>
            </React.Fragment>
          );
        })}

        {/* 曲线 */}
        {lineDots(curveP3, '#E84C4C', 1.5)}
        {lineDots(curveP50, '#3399FF', 2)}
        {lineDots(curveP97, '#E84C4C', 1.5)}

        {/* X轴刻度 */}
        {[0, 6, 12, 18, 24, 30, 36].map(m => (
          <Text key={m} style={[styles.xLabel, { left: x(m) - 6, top: H - 14 }]}>{m}</Text>
        ))}

        {/* 历史数据点 */}
        {records.map((r, i) => {
          const px = x(r.month), py = y(r.value);
          const dp = findClosest(data, r.month);
          let color = '#3399FF';
          if (dp) {
            if (r.value < dp.p15 || r.value > dp.p85) color = '#E84C4C';
          }
          return <View key={i} style={[styles.dataDot, { left: px - 4, top: py - 4, backgroundColor: color }]} />;
        })}
      </View>

      {/* 图例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#E84C4C' }]} /><Text style={styles.legendText}>P3/P97</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#3399FF' }]} /><Text style={styles.legendText}>P50</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3399FF' }]} /><Text style={styles.legendText}>我的记录</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.sm },
  title: { ...typography.caption1, fontWeight: '600', color: colors.fgSecondary, marginBottom: spacing.xs },
  band: { position: 'absolute', opacity: 0.5 },
  gridLine: { position: 'absolute', height: 0.5, backgroundColor: '#E8E4D9' },
  yLabel: { position: 'absolute', left: 2, fontSize: 8, color: '#8A8A9A' },
  xLabel: { position: 'absolute', fontSize: 8, color: '#8A8A9A' },
  lineDot: { position: 'absolute', opacity: 0.7 },
  dataDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption1, color: colors.muted },
});

export default GrowthChart;
