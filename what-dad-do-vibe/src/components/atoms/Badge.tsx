import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { radius, spacing, typography } from '../../styles/tokens';
import { useColors } from '../../context/ThemeContext';

interface BadgeProps extends ViewProps {
  label: string;
}

export function Badge({ label, style, ...props }: BadgeProps) {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
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
  }), [colors]);
  return (
    <View style={[styles.base, style]} {...props}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export default Badge;