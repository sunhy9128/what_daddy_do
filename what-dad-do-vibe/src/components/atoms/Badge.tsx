import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, spacing, typography } from '../../styles/tokens';

interface BadgeProps extends ViewProps {
  label: string;
}

export function Badge({ label, style, ...props }: BadgeProps) {
  return (
    <View style={[styles.base, style]} {...props}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
  },
  text: {
    ...typography.caption1,
    color: colors.muted,
  },
});

export default Badge;