import React from 'react';
import { Text, StyleSheet, View, ViewProps, TextProps } from 'react-native';
import { colors, radius, spacing, typography } from '../../styles/tokens';

type TagVariant = 'default' | 'short' | 'long' | 'custom' | 'success' | 'warning';

interface TagProps extends ViewProps {
  variant?: TagVariant;
  label: string;
}

const variantStyles = {
  default: { backgroundColor: colors.bg, color: colors.fg },
  short: { backgroundColor: '#f0f9ff', color: '#007aff' },
  long: { backgroundColor: '#f0fdf4', color: '#34c759' },
  custom: { backgroundColor: '#fef3c7', color: '#d97706' },
  success: { backgroundColor: '#f0fdf4', color: '#34c759' },
  warning: { backgroundColor: '#fef3c7', color: '#d97706' },
};

export function Tag({ variant = 'default', label, style, ...props }: TagProps) {
  const variantStyle = variantStyles[variant];
  return (
    <View style={[styles.base, { backgroundColor: variantStyle.backgroundColor }, style]} {...props}>
      <Text style={[styles.text, { color: variantStyle.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption1,
    fontWeight: '500',
  },
});

export default Tag;