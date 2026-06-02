import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GrowthDataPoint, BOY_GROWTH, GIRL_GROWTH } from '../../lib/growth-chart-data';
import { colors, spacing, typography } from '../../styles/tokens';

const W = 300, PANEL_H = 140, GAP = 2;
const TOTAL_H = PANEL_H * 2 + GAP + 24;
const PAD_L = 32, PAD_R = 4, PAD_T = 16, PAD_B = 6;
const PLOT_W = W - PAD_L - PAD_R;
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

function drawPanel(
  data: GrowthDataPoint[],
  yMin: number, yMax: number, yStep: number,
  colorP: string, colorM: string, band1: string, band2: string,
  records: { month: number; value: number }[],
  topOffset: number,
) {
  const x = (m: number) => PAD_L + (m / 36) * PLOT_W;
  const yPos = (v: number) => topOffset + PAD_T + ((yMax - v) / (yMax - yMin)) * PLOT_H;

  const els: React.ReactElement[] = [];

  // 水平网格线
  for (let v = yMin; v <= yMax; v += yStep) {
    const yy = yPos(v);
    els.push(<View key={`hg-${v}`} style={[s.grid, { top: yy, left: PAD_L, width: PLOT_W }]} />);
    els.push(<Text key={`yl-${v}`} style={[s.yLbl, { top: yy - 5 }]}>{v}</Text>);
  }

  // 色带
  for (let i = 0; i <= 72; i++) {
    const m = (i / 72) * 36;
    const cx = x(m);
    const p3 = yPos(interp(data, m, 'p3'));
    const p15 = yPos(interp(data, m, 'p15'));
    const p85 = yPos(interp(data, m, 'p85'));
    const p97 = yPos(interp(data, m, 'p97'));
    els.push(<View key={`b3-${i}`} style={[s.bar, { left: cx, top: p3, height: Math.max(1, p15 - p3), backgroundColor: band1 }]} />);
    els.push(<View key={`bm-${i}`} style={[s.bar, { left: cx, top: p15, height: Math.max(1, p85 - p15), backgroundColor: band2 }]} />);
    els.push(<View key={`b7-${i}`} style={[s.bar, { left: cx, top: p85, height: Math.max(1, p97 - p85), backgroundColor: band1 }]} />);
  }

  // 曲线
  for (let i = 0; i <= 72; i++) {
    const m = (i / 72) * 36;
    const cx = x(m);
    const addDot = (key: keyof GrowthDataPoint, color: string, size: number) => {
      const yy = yPos(interp(data, m, key));
      els.push(<View key={`c-${key}-${i}`} style={[s.dot, { left: cx - size / 2, top: yy - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />);
    };
    addDot('p97', colorP, 1.5);
    addDot('p50', colorM, 2);
    addDot('p3', colorP, 1.5);
  }

  // 数据点
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.value <= 0) continue;
    const px = x(r.month);
    const py = yPos(r.value);
    if (py < topOffset || py > topOffset + PANEL_H) continue;
    const v15 = interp(data, r.month, 'p15');
    const v85 = interp(data, r.month, 'p85');
    const dc = (r.value < v15 || r.value > v85) ? colorP : colorM;
    els.push(<View key={`dp-${i}`} style={[s.dataPt, { left: px - 4, top: py - 4, borderColor: dc }]} />);
  }

  return els;
}

export function GrowthChart({ gender, records }: Props) {
  const ds = gender === 'boy' ? BOY_GROWTH : GIRL_GROWTH;
  const lenData = ds.length;
  const wtData = ds.weight;

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
      <View style={{ width: W, height: TOTAL_H }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: TOTAL_H, backgroundColor: '#FCFAF5', borderRadius: 8 }} />

        {/* 上半：身长 */}
        {drawPanel(lenData, lenMin, lenMax, 5, '#D06060', '#CC4444', '#FFE0E0', '#E8FFE8', records.map(r => ({ month: r.month, value: r.height })), 0)}

        {/* 分隔线 */}
        <View style={{ position: 'absolute', left: PAD_L, top: PANEL_H, width: PLOT_W, height: 0.5, backgroundColor: colors.border }} />

        {/* 下半：体重 */}
        {drawPanel(wtData, wtMin, wtMax, 2, '#6080C0', '#4466CC', '#E0ECFF', '#E8FFF0', records.map(r => ({ month: r.month, value: r.weight })), PANEL_H + GAP)}

        {/* X 轴 */}
        {[0, 6, 12, 18, 24, 30, 36].map(m => (
          <Text key={m} style={[s.xLbl, { left: xFn(m) - 6, top: TOTAL_H - 30 }]}>{m}</Text>
        ))}
        <Text style={[s.xLbl, { left: W / 2 - 14, top: TOTAL_H - 14, fontWeight: '600', width: 28 }]}>月龄</Text>

        {/* 轴标题 */}
        <Text style={[s.axisTitle, { left: PAD_L - 2, top: 2, color: '#CC4444' }]}>身长 cm</Text>
        <Text style={[s.axisTitle, { left: PAD_L - 2, top: PANEL_H + GAP + 2, color: '#4466CC' }]}>体重 kg</Text>
      </View>

      <View style={s.legend}>
        <View style={s.legIt}><View style={[s.legDot, { backgroundColor: '#CC4444' }]} /><Text style={s.legTxt}>身长</Text></View>
        <View style={s.legIt}><View style={[s.legDot, { backgroundColor: '#4466CC' }]} /><Text style={s.legTxt}>体重</Text></View>
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
  xLbl: { position: 'absolute', fontSize: 8, color: '#8A8A9A', width: 14, textAlign: 'center' },
  axisTitle: { position: 'absolute', fontSize: 8, fontWeight: '600' },
  dot: { position: 'absolute', opacity: 0.7 },
  dataPt: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 2, backgroundColor: '#fff' },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legIt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legDot: { width: 10, height: 10, borderRadius: 5 },
  legTxt: { ...typography.caption2, color: colors.muted },
});

export default GrowthChart;
