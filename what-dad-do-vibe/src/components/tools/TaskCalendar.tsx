import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

// 本地类型定义（react-native-calendars 未导出这些类型）
type MarkedDateConfig = {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
  disabled?: boolean;
  disableTouchEvent?: boolean;
  inactive?: boolean;
  activeOpacity?: number;
  selectedTextColor?: string;
};
type MarkedDates = Record<string, MarkedDateConfig>;

export function TaskCalendar({ expanded }: { userId: string; babyGender?: string; expanded?: boolean }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const { state } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // 收集有 dueDate 的任务
  const tasksByDate = useMemo(() => {
    const map: Record<string, Array<{ id: string; title: string; isCompleted: boolean; type: string; description?: string }>> = {};
    for (const task of state.tasks) {
      if (!task.dueDate) continue;
      const dateKey = task.dueDate; // YYYY-MM-DD
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({
        id: task.id,
        title: task.title,
        isCompleted: task.isCompleted,
        type: task.type,
        description: task.description,
      });
    }
    return map;
  }, [state.tasks]);

  // 标记日期（有任务的标圆点，选中日标框）
  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {};
    for (const dateKey of Object.keys(tasksByDate)) {
      const tasks = tasksByDate[dateKey];
      const allDone = tasks.every(t => t.isCompleted);
      marks[dateKey] = {
        marked: true,
        dotColor: isDark ? '#5AB87A' : '#34c759',
        selected: dateKey === selectedDate,
        selectedColor: colors.accent,
        // 部分完成用黄色标记，全部完成用绿色标记
        // react-native-calendars 原生只支持单一 dotColor
        // 如果有已完成也有未完成的，标记一个混合圆点
      };
      // 如果有未完成任务，用橙色圆点强调
      if (!allDone) {
        marks[dateKey].dotColor = isDark ? '#D4A84E' : '#ff9f0a';
      }
    }
    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: colors.accent,
      };
    } else if (selectedDate && marks[selectedDate]) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.accent,
      };
    }
    return marks;
  }, [tasksByDate, selectedDate, colors.accent, isDark]);

  // 选中日期的任务列表
  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasksByDate[selectedDate] || [];
  }, [selectedDate, tasksByDate]);

  // 任务总数与完成数
  const totalWithDueDate = useMemo(
    () => state.tasks.filter(t => t.dueDate).length,
    [state.tasks]
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString.slice(0, 7));
  };

  // 日历主题
  const calendarTheme = useMemo(() => ({
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: colors.muted,
    selectedDayBackgroundColor: colors.accent,
    selectedDayTextColor: '#fff',
    todayTextColor: colors.accent,
    dayTextColor: colors.fg,
    textDisabledColor: colors.border,
    dotColor: '#34c759',
    selectedDotColor: '#fff',
    arrowColor: colors.accent,
    monthTextColor: colors.fg,
    indicatorColor: colors.accent,
    textDayFontFamily: undefined as any,
    textMonthFontFamily: undefined as any,
    textDayHeaderFontFamily: undefined as any,
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 13,
    'stylesheet.calendar.header': {
      week: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: spacing.sm,
        paddingBottom: spacing.xs,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      },
    },
  }), [colors, isDark]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      minHeight: expanded ? 500 : 350,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      ...typography.title2,
      fontWeight: '700',
      color: colors.accent,
    },
    statLabel: {
      ...typography.footnote,
      color: colors.muted,
      marginTop: 2,
    },
    calendarWrapper: {
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    taskList: {
      marginTop: spacing.md,
    },
    taskSectionTitle: {
      ...typography.headline,
      fontWeight: '600' as const,
      color: colors.fg,
      marginBottom: spacing.sm,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
    },
    taskIcon: {
      marginRight: spacing.sm,
    },
    taskTitle: {
      ...typography.callout,
      color: colors.fg,
      flex: 1,
    },
    taskTitleDone: {
      textDecorationLine: 'line-through',
      color: colors.muted,
    },
    taskType: {
      ...typography.caption1,
      color: colors.muted,
      marginLeft: spacing.sm,
    },
    taskDescription: {
      ...typography.footnote,
      color: colors.muted,
      marginTop: 2,
      marginLeft: spacing.md + 20,
      marginBottom: spacing.xs,
    },
    emptyText: {
      ...typography.callout,
      color: colors.muted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    emptyHint: {
      ...typography.footnote,
      color: colors.muted,
      textAlign: 'center',
      paddingBottom: spacing.md,
    },
  }), [colors, expanded]);

  return (
    <View style={styles.container}>
      {/* 统计概览 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalWithDueDate}</Text>
          <Text style={styles.statLabel}>待办任务</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {state.tasks.filter(t => t.dueDate && t.isCompleted).length}
          </Text>
          <Text style={styles.statLabel}>已完成</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Object.keys(tasksByDate).length}
          </Text>
          <Text style={styles.statLabel}>有任务的天</Text>
        </View>
      </View>

      {/* 日历 */}
      <View style={styles.calendarWrapper}>
        <Calendar
          current={currentMonth}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          theme={calendarTheme}
          enableSwipeMonths
          firstDay={1} // 周一开头
          hideExtraDays
        />
      </View>

      {/* 选中日的任务列表 */}
      <View style={styles.taskList}>
        {!selectedDate && (
          <Text style={styles.emptyHint}>点击日历上的日期查看当天任务</Text>
        )}
        {selectedDate && (
          <>
            <Text style={styles.taskSectionTitle}>
              {selectedDate} · {selectedTasks.length} 项任务
            </Text>
            {selectedTasks.length === 0 && (
              <Text style={styles.emptyText}>这天没有待办任务</Text>
            )}
            {selectedTasks.map(task => (
              <View key={task.id}>
                <View style={styles.taskItem}>
                  <Ionicons
                    name={task.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={task.isCompleted ? '#34c759' : colors.muted}
                    style={styles.taskIcon}
                  />
                  <Text
                    style={[
                      styles.taskTitle,
                      task.isCompleted && styles.taskTitleDone,
                    ]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <Text style={styles.taskType}>
                    {task.type === 'prenatal' ? '产检' : task.type === 'daily' ? '日常' : '打卡'}
                  </Text>
                </View>
                {task.description ? (
                  <Text style={styles.taskDescription} numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

export default TaskCalendar;
