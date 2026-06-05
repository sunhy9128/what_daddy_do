import React, { useMemo } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { radius, shadows, spacing } from '../../styles/tokens';
import { useColors } from '../../context/ThemeContext';

interface CardProps extends ViewProps {
  variant?: 'default' | 'secondary' | 'elevated';
}

function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const colors = useColors();
  const variantStyles = useMemo(() => StyleSheet.create({
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
  }), [colors]);
  const styles = useMemo(() => StyleSheet.create({
    base: {
      borderRadius: radius.md,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
  }), []);
  return (
    <View style={[styles.base, variantStyles[variant], style]} {...props}>
      {children}
    </View>
  );
}

export default Card;