import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { loadOvulationRecords, saveOvulationRecords, loadOvulationConfig, saveOvulationConfig, OvulationRecord, OvulationConfig } from '../../lib/storage';
import { LoadingDot } from './ToolBase';

const CYCLE_LENGTH_DEFAULT = 28;
const PERIOD_LENGTH_DEFAULT = 5;

export function OvulationTracker({ userId }: { userId: string; babyGender?: string }) {
  const colors = useColors();
  const [records, setRecords] = useState<OvulationRecord[]>([]);
  const [config, setConfig] = useState<OvulationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [configCycle, setConfigCycle] = useState('');
  const [configPeriod, setConfigPeriod] = useState('');
  const [configLastPeriod, setConfigLastPeriod] = useState('');
  const [tempInput, setTempInput] = useState('');
  const [selectedOpk, setSelectedOpk] = useState<'positive' | 'weak' | 'negative' | null>(null);
  const [selectedMucus, setSelectedMucus] = useState<OvulationRecord['cervicalMucus'] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const allRecordsRef = useRef<OvulationRecord[]>([]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const [loadedRecords, loadedConfig] = await Promise.all([
          loadOvulationRecords(userId),
          loadOvulationConfig(userId),
        ]);
        allRecordsRef.current = loadedRecords;
        setRecords(loadedRecords);
        if (!loadedConfig) {
          const defaultConfig: OvulationConfig = {
            cycleLength: CYCLE_LENGTH_DEFAULT,
            periodLength: PERIOD_LENGTH_DEFAULT,
          };
          setConfig(defaultConfig);
          setConfigCycle(defaultConfig.cycleLength.toString());
          setConfigPeriod(defaultConfig.periodLength.toString());
          await saveOvulationConfig(userId, defaultConfig);
        } else {
          setConfig(loadedConfig);
          setConfigCycle(loadedConfig.cycleLength.toString());
          setConfigPeriod(loadedConfig.periodLength.toString());
          setConfigLastPeriod(loadedConfig.lastPeriodStart ?? '');
        }
        // 填充今日记录
        const todayRecord = loadedRecords.find(r => r.date === todayStr);
        if (todayRecord) {
          setTempInput(todayRecord.temperature?.toString() ?? '');
          setSelectedOpk(todayRecord.opkResult ?? null);
          setSelectedMucus(todayRecord.cervicalMucus ?? null);
        }
      } catch (e) {
        console.error('Failed to load ovulation records:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persistRecords = (newRecords: OvulationRecord[]) => {
    if (!userId) return;
    allRecordsRef.current = newRecords;
    saveOvulationRecords(userId, newRecords);
  };

  const getTodayRecord = () => records.find(r => r.date === todayStr);

  const handleSaveToday = () => {
    const todayRecord: OvulationRecord = {
      date: todayStr,
      temperature: tempInput ? parseFloat(tempInput) : undefined,
      opkResult: selectedOpk ?? undefined,
      cervicalMucus: selectedMucus ?? undefined,
    };
    const otherDays = records.filter(r => r.date !== todayStr);
    const newRecords = [...otherDays, todayRecord];
    setRecords(newRecords);
    persistRecords(newRecords);
  };

  // 计算下次排卵日
  const getNextOvulationDay = (): string | null => {
    if (!config?.lastPeriodStart) return null;
    const cycleLen = config.cycleLength || CYCLE_LENGTH_DEFAULT;
    const lastStart = new Date(config.lastPeriodStart);
    const daysSinceStart = Math.floor((new Date(todayStr).getTime() - lastStart.getTime()) / 86400000);
    const daysUntilNext = cycleLen - (daysSinceStart % cycleLen);
    if (daysUntilNext <= 0 || daysUntilNext > cycleLen - 5) return null;
    const nextOvulation = new Date();
    nextOvulation.setDate(nextOvulation.getDate() + daysUntilNext);
    return nextOvulation.toISOString().split('T')[0];
  };

  // 获取周期的月经期日期（假设经期长度固定）
  const getPeriodDays = (year: number, month: number): string[] => {
    if (!config?.lastPeriodStart) return [];
    const cycleLen = config.cycleLength || CYCLE_LENGTH_DEFAULT;
    const periodLen = config.periodLength || PERIOD_LENGTH_DEFAULT;
    const lastStart = new Date(config.lastPeriodStart);
    const periodDays: string[] = [];
    // 从上次经期开始日往前推算本月的经期
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let current = new Date(lastStart);
    while (current <= lastDayOfMonth) {
      if (current >= firstDayOfMonth) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfCycle = Math.floor((current.getTime() - lastStart.getTime()) / 86400000) % cycleLen;
        if (dayOfCycle < periodLen && dayOfCycle >= 0) {
          periodDays.push(dateStr);
        }
      }
      current.setDate(current.getDate() + cycleLen);
    }
    return periodDays;
  };

  // 获取排卵日（下次月经前14天）
  const getOvulationDays = (year: number, month: number): string[] => {
    if (!config?.lastPeriodStart) return [];
    const cycleLen = config.cycleLength || CYCLE_LENGTH_DEFAULT;
    const lastStart = new Date(config.lastPeriodStart);
    const ovulationDays: string[] = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let current = new Date(lastStart);
    while (current <= lastDayOfMonth) {
      if (current >= firstDayOfMonth) {
        const dayOfCycle = Math.floor((current.getTime() - lastStart.getTime()) / 86400000) % cycleLen;
        if (dayOfCycle === cycleLen - 14) {
          ovulationDays.push(current.toISOString().split('T')[0]);
        }
      }
      current.setDate(current.getDate() + cycleLen);
    }
    return ovulationDays;
  };

  const nextOvulationDay = getNextOvulationDay();
  const daysUntilOvulation = nextOvulationDay
    ? Math.ceil((new Date(nextOvulationDay).getTime() - new Date(todayStr).getTime()) / 86400000)
    : null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const periodDays = getPeriodDays(currentYear, currentMonth);
  const ovulationDays = getOvulationDays(currentYear, currentMonth);

  const getRecordForDate = (date: string) => records.find(r => r.date === date);

  const getDayDot = (date: string) => {
    const record = getRecordForDate(date);
    if (!record) return null;
    if (record.opkResult === 'positive') return { color: colors.accent, label: '阳' };
    if (record.opkResult === 'weak') return { color: '#f59e0b', label: '弱' };
    if (record.temperature) return { color: '#3b82f6', label: '°C' };
    return { color: colors.success, label: '记' };
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingDots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    loadingText: { fontSize: 13, color: colors.fgSecondary },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.fgSecondary, marginBottom: 8, marginLeft: 4 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : { elevation: 1 }),
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    input: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.fg,
      backgroundColor: colors.bg,
    },
    chipGroup: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.bg,
    },
    chipActive: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    chipText: { fontSize: 13, color: colors.fg },
    chipTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    calendarContainer: { marginTop: 8 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    monthLabel: { fontSize: 15, fontWeight: '600', color: colors.fg },
    weekDaysRow: { flexDirection: 'row', marginBottom: 4 },
    weekDayText: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted, fontWeight: '500' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: { fontSize: 14, color: colors.fg },
    dayTextOther: { fontSize: 14, color: colors.muted },
    todayCell: { backgroundColor: colors.accent + '20', borderRadius: 8 },
    todayText: { fontWeight: '700', color: colors.accent },
    periodCell: { backgroundColor: '#fca5a5' + '40' },
    ovulationCell: { backgroundColor: '#86efac' + '40' },
    recordDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 4 },
    predictionCard: {
      backgroundColor: colors.accent + '15',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.accent + '30',
    },
    predictionTitle: { fontSize: 13, color: colors.fgSecondary, marginBottom: 4 },
    predictionValue: { fontSize: 28, fontWeight: '700', color: colors.accent },
    predictionSubtext: { fontSize: 12, color: colors.muted, marginTop: 4 },
    configRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    configLabel: { fontSize: 14, color: colors.fg, width: 80 },
    configInput: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.fg,
      backgroundColor: colors.bg,
    },
    configSaveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    emptyPrediction: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.divider,
    },
    emptyPredictionText: { fontSize: 14, color: colors.muted },
    legendRow: { flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: colors.muted },
  }), [colors]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 今日记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日记录 · {todayStr}</Text>
        <View style={styles.card}>
          {/* 体温 */}
          <Text style={[styles.sectionTitle, { marginLeft: 0, marginBottom: 8 }]}>基础体温 (°C)</Text>
          <TextInput
            style={styles.input}
            placeholder="如 36.5"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={tempInput}
            onChangeText={setTempInput}
            onBlur={handleSaveToday}
          />

          {/* 排卵试纸 */}
          <Text style={[styles.sectionTitle, { marginLeft: 0, marginBottom: 8, marginTop: 12 }]}>排卵试纸</Text>
          <View style={styles.chipGroup}>
            {([
              { key: 'positive', label: '强阳 ✓' },
              { key: 'weak', label: '弱阳' },
              { key: 'negative', label: '阴性' },
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={selectedOpk === key ? styles.chipActive : styles.chip}
                onPress={() => { setSelectedOpk(key); setTimeout(handleSaveToday, 100); }}
              >
                <Text style={selectedOpk === key ? styles.chipTextActive : styles.chipText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 宫颈粘液 */}
          <Text style={[styles.sectionTitle, { marginLeft: 0, marginBottom: 8, marginTop: 12 }]}>宫颈粘液</Text>
          <View style={styles.chipGroup}>
            {([
              { key: 'dry', label: '干燥' },
              { key: 'sticky', label: '粘稠' },
              { key: 'creamy', label: '奶油状' },
              { key: 'watery', label: '水状' },
              { key: 'egg-white', label: '蛋清状' },
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={selectedMucus === key ? styles.chipActive : styles.chip}
                onPress={() => { setSelectedMucus(key); setTimeout(handleSaveToday, 100); }}
              >
                <Text style={selectedMucus === key ? styles.chipTextActive : styles.chipText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 排卵预测 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>排卵预测</Text>
        {daysUntilOvulation !== null && daysUntilOvulation > 0 ? (
          <View style={styles.predictionCard}>
            <Text style={styles.predictionTitle}>距离排卵日还有</Text>
            <Text style={styles.predictionValue}>{daysUntilOvulation} 天</Text>
            <Text style={styles.predictionSubtext}>周期长度 {config?.cycleLength ?? CYCLE_LENGTH_DEFAULT} 天 · 经期 {config?.periodLength ?? PERIOD_LENGTH_DEFAULT} 天</Text>
          </View>
        ) : (
          <View style={styles.emptyPrediction}>
            <Text style={styles.emptyPredictionText}>设置经期信息后显示排卵预测</Text>
          </View>
        )}
        <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => {
          setShowConfig(true);
          setConfigCycle(config?.cycleLength?.toString() ?? CYCLE_LENGTH_DEFAULT.toString());
          setConfigPeriod(config?.periodLength?.toString() ?? PERIOD_LENGTH_DEFAULT.toString());
          setConfigLastPeriod(config?.lastPeriodStart ?? '');
        }}>
          <Text style={{ fontSize: 13, color: colors.accent }}>设置周期信息 →</Text>
        </TouchableOpacity>
      </View>

      {/* 周期日历 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {currentYear}年{currentMonth + 1}月 · 共{daysInMonth}天
        </Text>
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthLabel}>{currentYear}年{currentMonth + 1}月</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#fca5a5' }]} />
                <Text style={styles.legendText}>经期</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#86efac' }]} />
                <Text style={styles.legendText}>排卵日</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>已记录</Text>
              </View>
            </View>
          </View>
          <View style={styles.weekDaysRow}>
            {weekDays.map(d => <Text key={d} style={styles.weekDayText}>{d}</Text>)}
          </View>
          <View style={styles.calendarGrid}>
            {/* 空白填充 */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {/* 日期 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isPeriod = periodDays.includes(dateStr);
              const isOvulation = ovulationDays.includes(dateStr);
              const dot = getRecordForDate(dateStr);
              return (
                <View
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    isPeriod && !isToday && styles.periodCell,
                    isOvulation && !isToday && styles.ovulationCell,
                  ]}
                >
                  <Text style={isToday ? styles.todayText : styles.dayText}>{day}</Text>
                  {dot && <View style={[styles.recordDot, { backgroundColor: getDayDot(dateStr)?.color ?? colors.muted }]} />}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 配置弹窗 */}
      <Modal visible={showConfig} transparent animationType="fade" onRequestClose={() => setShowConfig(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.fg, marginBottom: 20 }}>周期设置</Text>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>周期长度</Text>
              <TextInput
                style={styles.configInput}
                placeholder="28"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={configCycle}
                onChangeText={setConfigCycle}
              />
              <Text style={{ color: colors.muted, marginLeft: 8 }}>天</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>经期长度</Text>
              <TextInput
                style={styles.configInput}
                placeholder="5"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={configPeriod}
                onChangeText={setConfigPeriod}
              />
              <Text style={{ color: colors.muted, marginLeft: 8 }}>天</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>上次经期</Text>
              <TextInput
                style={styles.configInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                value={configLastPeriod}
                onChangeText={setConfigLastPeriod}
              />
            </View>
            <TouchableOpacity style={styles.configSaveBtn} onPress={() => {
              const cycleVal = parseInt(configCycle, 10);
              const periodVal = parseInt(configPeriod, 10);
              if (!isNaN(cycleVal) && cycleVal > 0 && config) {
                const newConfig: OvulationConfig = {
                  ...config,
                  cycleLength: cycleVal,
                  periodLength: isNaN(periodVal) ? config.periodLength : periodVal,
                  lastPeriodStart: /^\d{4}-\d{2}-\d{2}$/.test(configLastPeriod) ? configLastPeriod : config.lastPeriodStart,
                };
                setConfig(newConfig);
                saveOvulationConfig(userId, newConfig);
              }
              setShowConfig(false);
            }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default OvulationTracker;