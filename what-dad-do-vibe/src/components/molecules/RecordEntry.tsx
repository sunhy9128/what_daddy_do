import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';

interface RecordEntryProps {
  title: string;
  content: string;
  time: string;
  isPrivate?: boolean;
  onPress?: () => void;
}

export function RecordEntry({ title, content, time, isPrivate = false, onPress }: RecordEntryProps) {
  return (
    <TouchableOpacity style={styles.entry} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{time}</Text>
          <Text style={styles.privacy}>{isPrivate ? '私密' : '公开'}</Text>
        </View>
      </View>
      <Text style={styles.content} numberOfLines={2}>{content}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  privacy: {
    ...typography.caption1,
    color: colors.muted,
  },
  content: {
    ...typography.footnote,
    color: colors.fg,
    lineHeight: 21,
  },
});

export default RecordEntry;