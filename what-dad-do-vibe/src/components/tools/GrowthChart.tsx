import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Polygon, Text as SvgText } from 'react-native-svg';
import { GrowthDataPoint, BOY_GROWTH, GIRL_GROWTH } from '../../lib/growth-chart-data';
import { colors, spacing, typography } from '../../styles/tokens';

const CHART_W = 300;
const CHART_H = 200;
const PAD = { top: 20, right: 10, bottom: 30, left: 35 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

interface GrowthChartProps {
  gender: 'boy' | 'girl';
  metric: 'weight' | 'length'; // weight (kg) or length (cm)
  records: { month: number; value: number }[];
}

function buildPath(data: GrowthDataPoint[], key: keyof GrowthDataPoint, xScale: (v: number) => number, yScale: (v: number) => number): string {
  return data
    .map((d, i) => {
      const x = xScale(d.month);
      const y = yScale(d[key] as number);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export function GrowthChart({ gender, metric, records }: GrowthChartProps) {
  const data = gender === 'boy' ? BOY_GROWTH : GIRL_GROWTH;
  const dataset = metric === 'weight' ? data.weight : data.length;

  const allVals = dataset.flatMap(d => [d.p3, d.p97]);
  const yMin = Math.floor(Math.min(...allVals) / 5) * 5;
  const yMax = Math.ceil(Math.max(...allVals) / 5) * 5;
  const yRange = yMax - yMin;

  const xScale = (m: number) => PAD.left + (m / 36) * PLOT_W;
  const yScale = (v: number) => PAD.top + ((yMax - v) / yRange) * PLOT_H;

  const unit = metric === 'weight' ? 'kg' : 'cm';
  const title = metric === 'weight' ? '体重' : '身长';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}（{unit}）</Text>
      <Svg width={CHART_W} height={CHART_H}>
        {/* Y轴网格线 */}
        {Array.from({ length: Math.floor(yRange / 5) + 1 }, (_, i) => {
          const val = yMin + i * 5;
          const y = yScale(val);
          return (
            <React.Fragment key={i}>
              <Line x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="#E8E4D9" strokeWidth={0.5} />
              <SvgText x={4} y={y + 4} fontSize={9} fill="#8A8A9A" textAnchor="start">{val}</SvgText>
            </React.Fragment>
          );
        })}

        {/* 色带 */}
        <Polygon points={buildPath(dataset, 'p3', xScale, yScale) + ' ' + buildPathReverse(dataset, 'p15', xScale, yScale)} fill="#FFE0E0" opacity={0.5} />
        <Polygon points={buildPath(dataset, 'p15', xScale, yScale) + ' ' + buildPathReverse(dataset, 'p85', xScale, yScale)} fill="#E0FFE0" opacity={0.3} />
        <Polygon points={buildPath(dataset, 'p85', xScale, yScale) + ' ' + buildPathReverse(dataset, 'p97', xScale, yScale)} fill="#FFE0E0" opacity={0.5} />

        {/* P3 线 */}
        <Path d={buildPath(dataset, 'p3', xScale, yScale)} stroke="#E84C4C" strokeWidth={1} fill="none" />
        {/* P50 线 */}
        <Path d={buildPath(dataset, 'p50', xScale, yScale)} stroke="#3399FF" strokeWidth={1.5} fill="none" />
        {/* P97 线 */}
        <Path d={buildPath(dataset, 'p97', xScale, yScale)} stroke="#E84C4C" strokeWidth={1} fill="none" />

        {/* X轴刻度 */}
        {[0, 3, 6, 9, 12, 18, 24, 30, 36].map(m => (
          <React.Fragment key={m}>
            <Line x1={xScale(m)} y1={PAD.top} x2={xScale(m)} y2={CHART_H - PAD.bottom} stroke="#E8E4D9" strokeWidth={0.5} />
          </React.Fragment>
        ))}
        {[0, 6, 12, 18, 24, 30, 36].map(m => (
          <SvgText key={m} x={xScale(m)} y={CHART_H - 6} fontSize={8} fill="#8A8A9A" textAnchor="middle">{m}</SvgText>
        ))}

        {/* 历史数据点 */}
        {records.map((r, i) => {
          const x = xScale(r.month);
          const y = yScale(r.value);
          // 计算所在百分位区间
          const dp = findClosest(dataset, r.month);
          let color = '#3399FF';
          if (dp) {
            if (r.value < dp.p15) color = '#E84C4C';
            else if (r.value > dp.p85) color = '#E84C4C';
          }
          return <Circle key={i} cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />;
        })}
      </Svg>

      {/* 图例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#E84C4C' }]} /><Text style={styles.legendText}>P3/P97</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3399FF' }]} /><Text style={styles.legendText}>P50</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3399FF', width: 8, height: 8, borderRadius: 4 }]} /><Text style={styles.legendText}>我的记录</Text></View>
      </View>

      <Text style={styles.xLabel}>月龄</Text>
    </View>
  );
}

function buildPathReverse(data: GrowthDataPoint[], key: keyof GrowthDataPoint, xScale: (v: number) => number, yScale: (v: number) => number): string {
  return data
    .slice()
    .reverse()
    .map(d => {
      const x = xScale(d.month);
      const y = yScale(d[key] as number);
      return `L${x},${y}`;
    })
    .join(' ');
}

function findClosest(data: GrowthDataPoint[], month: number): GrowthDataPoint | null {
  let best = data[0];
  let bestDiff = Math.abs(data[0].month - month);
  for (const d of data) {
    const diff = Math.abs(d.month - month);
    if (diff < bestDiff) { best = d; bestDiff = diff; }
  }
  return best || null;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.sm },
  title: { ...typography.caption1, fontWeight: '600', color: colors.fgSecondary, marginBottom: spacing.xs },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption1, color: colors.muted },
  xLabel: { ...typography.caption1, color: colors.muted, marginTop: 2 },
});

export default GrowthChart;
