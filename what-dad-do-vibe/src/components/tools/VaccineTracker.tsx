import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, Alert, Platform, useWindowDimensions } from 'react-native';
import { getVaccines, getUserVaccinations, setVaccinationStatus } from '../../lib/api';
import { Vaccine, VaccineDose, UserVaccination } from '../../lib/supabase';
import { colors, spacing, typography } from '../../styles/tokens';
import { LoadingDot } from './ToolBase';

const CELL_H = 36;


export function VaccineTracker({ userId }: { userId: string; babyGender?: string }) {
  const { width: screenW } = useWindowDimensions();
  const [vaccines, setVaccines] = useState<(Vaccine & { doses: VaccineDose[] })[]>([]);
  const [userVax, setUserVax] = useState<Map<number, UserVaccination>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDose, setSelectedDose] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState(String(now.getDate()).padStart(2, '0'));

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
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
      } catch (e) {
        console.error('Failed to load vaccine data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const openConfirm = (doseId: number, current?: UserVaccination) => {
    const done = current?.is_vaccinated || false;
    setSelectedDose(doseId);
    setIsDone(done);
    if (!done) {
      const n = new Date();
      setYear(String(n.getFullYear()));
      setMonth(String(n.getMonth() + 1).padStart(2, '0'));
      setDay(String(n.getDate()).padStart(2, '0'));
    }
    setShowModal(true);
  };

  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (selectedDose === null || saving) return;
    if (!isDone) {
      const y = parseInt(year, 10), m = parseInt(month, 10), d = parseInt(day, 10);
      if (isNaN(y) || y < 1900 || y > 2100) { if (Platform.OS === 'web') { window.alert('无效日期，请输入正确的年份'); } else { Alert.alert('无效日期', '请输入正确的年份'); } return; }
      if (isNaN(m) || m < 1 || m > 12) { if (Platform.OS === 'web') { window.alert('无效日期，月份应在 1-12 之间'); } else { Alert.alert('无效日期', '月份应在 1-12 之间'); } return; }
      if (isNaN(d) || d < 1 || d > 31) { if (Platform.OS === 'web') { window.alert('无效日期，日期应在 1-31 之间'); } else { Alert.alert('无效日期', '日期应在 1-31 之间'); } return; }
    }
    setSaving(true);
    try {
      if (isDone) {
        const res = await setVaccinationStatus(userId, selectedDose, false);
        setUserVax(prev => { const m = new Map(prev); m.set(selectedDose, res); return m; });
      } else {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const res = await setVaccinationStatus(userId, selectedDose, true, dateStr);
        setUserVax(prev => { const m = new Map(prev); m.set(selectedDose, res); return m; });
      }
      setShowModal(false);
    } catch (e: any) {
      if (Platform.OS === 'web') { window.alert('操作失败：' + (e.message || '未知错误')); } else { Alert.alert('操作失败', e.message); }
    } finally {
      setSaving(false);
    }
  };

  // 按免费/自费分组
  const grouped = useMemo(() => {
    const free = vaccines.filter(v => v.category === '免费');
    const paid = vaccines.filter(v => v.category === '自费');
    return { free, paid };
  }, [vaccines]);

  const maxDoses = useMemo(() => Math.max(...vaccines.map(v => v.total_doses), 4), [vaccines]);
  // 表格宽度自适应
  const availW = screenW - 40; // 减去左右内边距
  const NAME_W = Math.max(56, Math.min(88, Math.floor(availW * 0.22)));
  const CELL_W = Math.max(32, Math.min(52, Math.floor((availW - NAME_W) / (maxDoses + 1))));

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const renderTable = (title: string, list: (Vaccine & { doses: VaccineDose[] })[], color: string) => (
    <View style={styles.tableSection}>
      <Text style={[styles.tableTitle, { color }]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { width: NAME_W }]}>
              <Text style={styles.headerText}>疫苗名称</Text>
            </View>
            {Array.from({ length: maxDoses }, (_, i) => (
              <View key={i} style={[styles.headerCell, { width: CELL_W }]}>
                <Text style={styles.headerText}>第{i + 1}剂</Text>
              </View>
            ))}
            <View style={[styles.headerCell, { width: NAME_W * 0.8 }]}>
              <Text style={styles.headerText}>月龄</Text>
            </View>
          </View>
          {list.map(vax => (
            <View key={vax.id} style={[styles.row, { borderLeftColor: color }]}>
              <View style={[styles.nameCell, { width: NAME_W }]}>
                <Text style={styles.nameText} numberOfLines={2}>{vax.name}</Text>
              </View>
              {Array.from({ length: maxDoses }, (_, i) => {
                const dose = vax.doses[i];
                if (!dose) return <View key={`${vax.id}-empty-${i}`} style={[styles.cell, { width: CELL_W }]} />;
                const record = userVax.get(dose.id);
                const done = record?.is_vaccinated || false;
                const dateStr = record?.vaccinated_at || '';
                return (
                  <TouchableOpacity
                    key={dose.id}
                    style={[styles.cell, { width: CELL_W }, done && styles.cellDone]}
                    onPress={() => openConfirm(dose.id, record)}
                  >
                    {done ? (
                      <><Text style={styles.cellDoneText}>✓</Text>{dateStr && <Text style={styles.cellDate}>{formatDate(dateStr)}</Text>}</>
                    ) : (
                      <Text style={styles.cellEmpty}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              <View style={[styles.cell, { width: NAME_W * 0.8, justifyContent: 'center' }]}>
                <Text style={styles.ageText}>{vax.doses.length > 0 ? `${vax.doses[0].min_age_months}月` : '-'}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} nestedScrollEnabled>
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
        <>
          {renderTable('免费疫苗', grouped.free, '#4D96FF')}
          {renderTable('自费疫苗', grouped.paid, '#FF8E53')}

          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: colors.success }]}><Text style={styles.swatchText}>✓</Text></View><Text style={styles.legendText}>已接种</Text></View>
            <View style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: colors.surfaceSecondary }]}><Text style={[styles.swatchText, { color: colors.muted }]}>+</Text></View><Text style={styles.legendText}>未接种</Text></View>
          </View>
        </>
      )}

      {/* 确认弹窗 */}
      <Modal visible={showModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{isDone ? '取消接种' : '确认接种'}</Text>
            {!isDone && (
              <>
                <Text style={styles.modalHint}>请选择接种日期：</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>年</Text>
                    <TextInput style={styles.dateInput} value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
                  </View>
                  <Text style={styles.dateSep}>/</Text>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>月</Text>
                    <TextInput style={styles.dateInput} value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} />
                  </View>
                  <Text style={styles.dateSep}>/</Text>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>日</Text>
                    <TextInput style={styles.dateInput} value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} />
                  </View>
                </View>
              </>
            )}
            {isDone && <Text style={styles.modalHint}>确定要取消该剂次的接种记录吗？</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={saving}>
                <Text style={styles.confirmText}>{saving ? '保存中…' : '确定'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 360 },
  tableSection: { marginBottom: spacing.md },
  tableTitle: { ...typography.callout, fontWeight: '700', marginBottom: spacing.xs, paddingLeft: spacing.xs },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 2 },
  headerCell: { alignItems: 'center', justifyContent: 'center' },
  headerText: { ...typography.caption1, fontWeight: '600', color: colors.muted },
  row: { flexDirection: 'row', borderLeftWidth: 3, marginBottom: 1, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' },
  nameCell: { paddingHorizontal: spacing.xs, justifyContent: 'center', paddingVertical: spacing.xs },
  nameText: { ...typography.caption1, color: colors.fg, fontSize: 11, lineHeight: 14 },
  cell: { height: CELL_H, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 0.5, borderLeftColor: colors.border },
  cellDone: { backgroundColor: colors.success + '15' },
  cellDoneText: { fontSize: 14, color: colors.success, fontWeight: '700' },
  cellDate: { fontSize: 8, color: colors.success, marginTop: 1, fontWeight: '500' },
  cellEmpty: { fontSize: 16, color: colors.muted, fontWeight: '300' },
  ageText: { ...typography.caption1, color: colors.muted, fontSize: 10 },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 16, height: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  swatchText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  legendText: { ...typography.caption2, color: colors.muted },
  // 弹窗
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  modal: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, width: '100%', maxWidth: 360 },
  modalTitle: { ...typography.title3, fontWeight: '700', marginBottom: spacing.md },
  modalHint: { ...typography.footnote, color: colors.fgSecondary, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  dateField: { alignItems: 'center' },
  dateLabel: { ...typography.caption1, color: colors.muted, marginBottom: spacing.xs },
  dateInput: { ...typography.title3, fontWeight: '700', color: colors.accent, textAlign: 'center', width: 60, paddingVertical: spacing.xs, borderBottomWidth: 2, borderBottomColor: colors.border },
  dateSep: { ...typography.title3, color: colors.muted, marginTop: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 8 },
  cancelText: { ...typography.callout, color: colors.muted },
  confirmBtn: { backgroundColor: colors.accent, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 8 },
  confirmText: { ...typography.callout, fontWeight: '600', color: '#fff' },
  confirmBtnDisabled: { opacity: 0.5 },
  // 加载动画
  loadingContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary + '40',
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  loadingText: { ...typography.footnote, color: colors.muted },
});

export default VaccineTracker;
