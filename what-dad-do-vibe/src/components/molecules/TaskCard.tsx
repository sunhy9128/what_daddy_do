import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '../atoms';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

interface TaskCardProps {
  title: string;
  description?: string;
  type: 'prenatal' | 'daily' | 'checkin';
  dueDate?: string;
  isCompleted?: boolean;
  dailyCount?: number;
  streakCount?: number;
  onPress?: () => void;
  onToggle?: () => void;
  onInfo?: () => void;
  onNavigate?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

const typeLabels = {
  prenatal: '产检',
  daily: '日常',
  checkin: '日打卡',
};

const typeVariants = {
  prenatal: 'short' as const,
  daily: 'long' as const,
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
  onNavigate,
  onDelete,
  readOnly = false,
}: TaskCardProps) {
  const isDaily = type === 'daily';
  const isCheckin = type === 'checkin';

  // 防重复提交守卫
  const tappingRef = useRef(false);
  const [toggling, setToggling] = useState(false);

  // 组件卸载后不再 setState
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
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
      color: colors.fg,
      marginBottom: spacing.xs,
    },
    titleCompleted: {
      color: colors.muted,
    },
    description: {
      ...typography.footnote,
      color: colors.fgSecondary,
      marginBottom: spacing.xs,
    },
    descCompleted: {
      color: colors.muted,
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
    dueDateEmpty: {
      color: colors.muted,
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
    circleDisabled: {
      opacity: 0.45,
    },
    checkboxDisabled: {
      opacity: 0.45,
    },
    streakCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    streakText: {
      color: colors.surface,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    streakLabel: {
      ...typography.footnote,
      color: colors.success,
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
    navigateButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
    },
  }), [colors]);

  const handleToggle = () => {
    if (tappingRef.current || toggling || !onToggle) return;
    tappingRef.current = true;
    setToggling(true);
    // 调用完成后释放（有异步则等异步；onToggle 若抛出则回滚）
    // Promise rejection 已在 AppContext 内部 catch 并 console.error，
    // 此处 .catch() 仅阻止未处理的 rejection 传播
    try {
      const result = onToggle();
      Promise.resolve(result).finally(() => {
        tappingRef.current = false;
        if (mountedRef.current) {
          setToggling(false);
        }
      }).catch(() => {});
    } catch {
      tappingRef.current = false;
      setToggling(false);
    }
  };

  const handleInfoPress = () => {
    if (onInfo) {
      onInfo();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {isCheckin ? (
        <TouchableOpacity
          style={[styles.streakCircle, toggling && styles.circleDisabled]}
          onPress={handleToggle}
          disabled={toggling || !onToggle || isCompleted || readOnly}
          activeOpacity={0.6}
        >
          <Text style={styles.streakText}>{isCompleted ? '已打卡' : '打卡'}</Text>
        </TouchableOpacity>
      ) : isDaily ? (
        <TouchableOpacity
          style={[styles.countCircle, toggling && styles.circleDisabled]}
          onPress={handleToggle}
          disabled={toggling || !onToggle || readOnly}
          activeOpacity={0.6}
        >
          <Text style={styles.countText}>{dailyCount}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxChecked, toggling && styles.checkboxDisabled]}
          onPress={handleToggle}
          disabled={toggling || !onToggle || readOnly}
          activeOpacity={0.6}
        >
          {isCompleted && (
            <Ionicons name="checkmark" size={14} color={colors.surface} />
          )}
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>{title}</Text>
        {description ? <Text style={[styles.description, isCompleted && styles.descCompleted]} numberOfLines={1}>{description}</Text> : null}
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
          ) : type === 'prenatal' ? (
            <Text style={[styles.dueDate, styles.dueDateEmpty]}>未预约</Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {onInfo && (
          <TouchableOpacity style={styles.infoButton} onPress={handleInfoPress}>
            <Ionicons name="information-circle-outline" size={18} color={colors.fgSecondary} />
          </TouchableOpacity>
        )}
        {type === 'prenatal' && onNavigate && (
          <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
            <Ionicons name="navigate-outline" size={14} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}


export default TaskCard;