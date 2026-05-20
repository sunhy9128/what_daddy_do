import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Tag } from '../atoms';
import { colors, radius, spacing, typography } from '../../styles/tokens';

interface TaskCardProps {
  title: string;
  description?: string;
  type: 'prenatal' | 'daily' | 'custom' | 'checkin';
  dueDate?: string;
  isCompleted?: boolean;
  dailyCount?: number;
  streakCount?: number;
  onPress?: () => void;
  onToggle?: () => void;
  onInfo?: () => void;
  onDelete?: () => void;
}

const typeLabels = {
  prenatal: '产检',
  daily: '日常',
  custom: '自建',
  checkin: '日打卡',
};

const typeVariants = {
  prenatal: 'short' as const,
  daily: 'long' as const,
  custom: 'custom' as const,
  checkin: 'long' as const,
};

export function TaskCard({
  title,
  description,
  type,
  dueDate,
  isCompleted = false,
  dailyCount = 0,
  streakCount = 0,
  onPress,
  onToggle,
  onInfo,
  onDelete,
}: TaskCardProps) {
  const isDaily = type === 'daily';
  const isCheckin = type === 'checkin';

  const handleInfoPress = () => {
    if (onInfo) {
      onInfo();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {isCheckin ? (
        <TouchableOpacity style={styles.streakCircle} onPress={onToggle}>
          <Text style={styles.streakText}>{streakCount}</Text>
        </TouchableOpacity>
      ) : isDaily ? (
        <TouchableOpacity style={styles.countCircle} onPress={onToggle}>
          <Text style={styles.countText}>{dailyCount}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
          onPress={onToggle}
          disabled={!onToggle}
        >
          {isCompleted && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.meta}>
          <Tag label={typeLabels[type]} variant={typeVariants[type]} />
          {isCheckin ? (
            <Text style={styles.streakLabel}>连续 {streakCount} 天</Text>
          ) : isDaily ? (
            <Text style={styles.countLabel}>今日 {dailyCount} 次</Text>
          ) : dueDate ? (
            <Text style={styles.dueDate}>
              {isCompleted ? '已完成' : dueDate}
            </Text>
          ) : null}
        </View>
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.infoButton} onPress={handleInfoPress}>
          <Text style={styles.infoButtonText}>i</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.callout,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dueDate: {
    ...typography.footnote,
    color: colors.fgSecondary,
  },
  countCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  countText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  countLabel: {
    ...typography.footnote,
    color: colors.accent,
    fontWeight: '600',
  },
  streakCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34c759',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  streakText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  streakLabel: {
    ...typography.footnote,
    color: '#34c759',
    fontWeight: '600',
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 14,
    color: colors.fgSecondary,
    fontWeight: '600',
  },
});

export default TaskCard;