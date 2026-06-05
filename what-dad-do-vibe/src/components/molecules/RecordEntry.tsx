import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

interface RecordEntryProps {
  title: string;
  content: string;
  time: string;
  isPrivate?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}

export function RecordEntry({ title, content, time, isPrivate = false, onPress, onDelete }: RecordEntryProps) {
  const colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
    entry: {
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.callout,
      fontWeight: '600',
      flex: 1,
      marginRight: spacing.sm,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    time: {
      ...typography.caption1,
      color: colors.muted,
    },
    deleteBtn: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteIcon: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '600',
    },
    content: {
      ...typography.footnote,
      color: colors.fg,
      lineHeight: 21,
    },
  }), [colors]);

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('确定要删除这条记录吗？删除后无法恢复。')) {
        onDelete?.();
      }
    } else {
      Alert.alert('删除记录', '确定要删除这条记录吗？删除后无法恢复。', [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: onDelete },
      ]);
    }
  };

  return (
    <TouchableOpacity style={styles.entry} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{time}</Text>
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.content} numberOfLines={2}>{content}</Text>
    </TouchableOpacity>
  );
}


export default RecordEntry;