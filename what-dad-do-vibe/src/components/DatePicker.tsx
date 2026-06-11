import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useColors } from '../context/ThemeContext';
import { spacing, typography, radius } from '../styles/tokens';

interface DatePickerProps {
  value: string;  // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
  label?: string;
}

// ─── 日期格式转换 ────────────────────────────────────────────

function toDate(str: string): Date {
  if (!str) return new Date();
  const parts = str.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function toStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ─── Web: 原生 <input type="date"> ─────────────────────────

function WebDatePicker({ value, onChange, minDate }: DatePickerProps) {
  const colors = useColors();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const today = new Date();
  const min = minDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <View style={styles.webWrapper}>
      <input
        type="date"
        value={value}
        onChange={handleChange}
        min={min}
        style={{
          width: '100%',
          height: 44,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.sm,
          padding: '0 12px',
          fontSize: 16,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: colors.fg,
          backgroundColor: colors.surface,
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      />
    </View>
  );
}

// ─── iOS: 原生滚轮选择器 (inline spinner) ─────────────────

function IOSDatePicker({ value, onChange, minDate }: DatePickerProps) {
  const date = toDate(value);
  const min = minDate ? toDate(minDate) : undefined;

  const handleChange = useCallback((_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onChange(toStr(selectedDate));
    }
  }, [onChange]);

  return (
    <View style={styles.iosWrapper}>
      <DateTimePicker
        value={date}
        mode="date"
        display="spinner"
        minimumDate={min}
        onChange={handleChange}
        locale="zh-Hans"
      />
    </View>
  );
}

// ─── Android: 原生 DatePickerDialog (点击弹出) ──────────

function AndroidDatePicker({ value, onChange, minDate, label }: DatePickerProps) {
  const colors = useColors();
  const date = toDate(value);
  const min = minDate ? toDate(minDate) : undefined;

  // 格式化显示中文日期
  const displayDate = (() => {
    if (!value) return '请选择日期';
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return '请选择日期';
    const [y, m, d] = parts;
    return `${y}年${m}月${d}日`;
  })();

  const handlePress = useCallback(() => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      minimumDate: min,
      onChange: (_event, selectedDate) => {
        if (_event.type === 'set' && selectedDate) {
          onChange(toStr(selectedDate));
        }
      },
    });
  }, [date, min, onChange]);

  return (
    <View style={styles.androidWrapper}>
      <TouchableOpacity
        style={[styles.androidButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.androidDateText, { color: colors.fg }]}>
          {displayDate}
        </Text>
        <Text style={[styles.androidHint, { color: colors.muted }]}>
          点击选择预产期
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 样式 ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  webWrapper: {
    marginBottom: spacing.md,
  },
  iosWrapper: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  androidWrapper: {
    marginBottom: spacing.md,
  },
  androidButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidDateText: {
    ...typography.title2,
    fontWeight: '600',
  },
  androidHint: {
    ...typography.caption1,
    marginTop: spacing.xs,
  },
});

// ─── 入口 ──────────────────────────────────────────────────

export function DatePicker(props: DatePickerProps) {
  if (Platform.OS === 'web') return <WebDatePicker {...props} />;
  if (Platform.OS === 'ios') return <IOSDatePicker {...props} />;
  return <AndroidDatePicker {...props} />;
}

export default DatePicker;
