import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '../../styles/tokens';

interface CardProps extends ViewProps {
  variant?: 'default' | 'secondary' | 'elevated';
}

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.surface,
  },
  secondary: {
    backgroundColor: colors.surfaceSecondary,
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
});

export default Card;