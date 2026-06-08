import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, ScrollView, TouchableOpacity, NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import { useColors } from '../context/ThemeContext';
import { spacing, typography, radius } from '../styles/tokens';

interface DatePickerProps {
  value: string;  // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
  label?: string;
}

// 生成年份列表（当前年-5 到 当前年+2）
const generateYears = () => {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now - 5; y <= now + 2; y++) years.push(y);
  return years;
};
const YEARS = generateYears();
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

// Web: 原生日期选择器
function WebDatePicker({ value, onChange, minDate }: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = useColors();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const today = new Date();
  const min = minDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <View style={webStyles.wrapper}>
      <input
        ref={inputRef}
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

const webStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
});

// Native: 三列滚动选择器
function NativeDatePicker({ value, onChange, minDate }: DatePickerProps) {
  const colors = useColors();
  const today = new Date();

  const parsed = value ? value.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  const [selYear, selMonth, selDay] = parsed.length === 3 ? parsed : [today.getFullYear(), today.getMonth() + 1, today.getDate()];

  const daysInMonth = getDaysInMonth(selYear, selMonth);
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 找到当前值在列表中的索引
  const yearIdx = YEARS.indexOf(selYear);
  const monthIdx = MONTHS.indexOf(selMonth);
  const dayIdx = DAYS.indexOf(selDay);

  const updateDate = useCallback((y: number, m: number, d: number) => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${y}-${mm}-${dd}`);
  }, [onChange]);

  const renderColumn = (items: number[], selectedIdx: number, onSelect: (val: number) => void) => {
    return (
      <ScrollView
        style={nativeStyles.column}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={nativeStyles.columnContent}
      >
        {items.map((val, i) => {
          const isSelected = i === selectedIdx;
          return (
            <TouchableOpacity
              key={val}
              style={[nativeStyles.colItem, isSelected && nativeStyles.colItemSelected]}
              onPress={() => onSelect(val)}
              activeOpacity={0.6}
            >
              <Text style={[nativeStyles.colItemText, isSelected && nativeStyles.colItemTextSelected]}>
                {String(val).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={nativeStyles.wrapper}>
      <View style={nativeStyles.row}>
        {renderColumn(YEARS, Math.max(0, yearIdx), (v) => {
          const newDays = getDaysInMonth(v, selMonth);
          const d = Math.min(selDay, newDays);
          updateDate(v, selMonth, d);
        })}
        <Text style={nativeStyles.sep}>年</Text>
        {renderColumn(MONTHS, Math.max(0, monthIdx), (v) => {
          const newDays = getDaysInMonth(selYear, v);
          const d = Math.min(selDay, newDays);
          updateDate(selYear, v, d);
        })}
        <Text style={nativeStyles.sep}>月</Text>
        {renderColumn(DAYS, Math.max(0, dayIdx), (v) => updateDate(selYear, selMonth, v))}
        <Text style={nativeStyles.sep}>日</Text>
      </View>
    </View>
  );
}

const nativeStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  column: {
    height: 160,
    width: 64,
  },
  columnContent: {
    paddingVertical: 0,
  },
  colItem: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  colItemSelected: {
    backgroundColor: 'rgba(74, 107, 138, 0.12)',
  },
  colItemText: {
    ...typography.callout,
    color: '#999',
    fontWeight: '500',
  },
  colItemTextSelected: {
    color: '#4A6B8A',
    fontWeight: '700',
  },
  sep: {
    ...typography.title3,
    color: '#999',
    marginHorizontal: 2,
    fontWeight: '500',
  },
});

export function DatePicker(props: DatePickerProps) {
  return Platform.OS === 'web' ? <WebDatePicker {...props} /> : <NativeDatePicker {...props} />;
}

export default DatePicker;
