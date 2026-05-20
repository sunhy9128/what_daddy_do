import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../styles/tokens';

interface KnowledgeCardProps {
  emoji: string;
  title: string;
  readTime: string;
  source?: string;
  onPress?: () => void;
}

export function KnowledgeCard({ emoji, title, readTime, source = '官方', onPress }: KnowledgeCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumb}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{source} · {readTime}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  thumb: {
    width: 64,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.callout,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.caption1,
    color: colors.muted,
  },
});

export default KnowledgeCard;