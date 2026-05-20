import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar, Badge } from '../atoms';
import { colors, radius, spacing, typography } from '../../styles/tokens';

interface PostCardProps {
  authorName: string;
  stage: string;
  time: string;
  category: string;
  content: string;
  likes: number;
  comments: number;
  onPress?: () => void;
}

export function PostCard({
  authorName,
  stage,
  time,
  category,
  content,
  likes,
  comments,
  onPress,
}: PostCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Avatar name={authorName} size="medium" />
        <View style={styles.authorInfo}>
          <Text style={styles.name}>{authorName}</Text>
          <Text style={styles.meta}>{stage} · {time}</Text>
        </View>
        <Badge label={category} />
      </View>
      <Text style={styles.content}>{content}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action}>
          <Text style={styles.actionIcon}>♥</Text>
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.callout,
    fontWeight: '600',
  },
  meta: {
    ...typography.caption1,
    color: colors.muted,
  },
  content: {
    ...typography.callout,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    ...typography.footnote,
    color: colors.muted,
  },
});

export default PostCard;