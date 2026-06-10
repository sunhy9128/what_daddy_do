import React, { useMemo } from 'react';
import { Text, StyleSheet, View, ViewProps } from 'react-native';
import { radius, spacing, typography } from '../../styles/tokens';
import { useColors, useTheme } from '../../context/ThemeContext';

type TagVariant = 'default' | 'short' | 'long' | 'success' | 'warning';

interface TagProps extends ViewProps {
  variant?: TagVariant;
  label: string;
}

const VARIANT_STYLES: Record<TagVariant, { bg: string; fg: string }> = {
  default: { bg: '', fg: '' }, // handled by theme
  short: { bg: '#f0f9ff', fg: '#007aff' },
  long: { bg: '#f0fdf4', fg: '#34c759' },
  success: { bg: '#f0fdf4', fg: '#34c759' },
  warning: { bg: '#fef3c7', fg: '#d97706' },
};

const DARK_VARIANT_STYLES: Record<TagVariant, { bg: string; fg: string }> = {
  default: { bg: '', fg: '' },
  short: { bg: '#1A2A4A', fg: '#5A9AE0' },
  long: { bg: '#1A3A2A', fg: '#5AB87A' },
  success: { bg: '#1A3A2A', fg: '#5AB87A' },
  warning: { bg: '#3A2A10', fg: '#D4A84E' },
};

export function Tag({ variant = 'default', label, style, ...props }: TagProps) {
  const colors = useColors();
  const { isDark } = useTheme();
  const variantColors = isDark
    ? DARK_VARIANT_STYLES[variant]
    : VARIANT_STYLES[variant];
  const bgColor = variant === 'default' ? colors.bg : variantColors.bg;
  const fgColor = variant === 'default' ? colors.fg : variantColors.fg;
  const styles = useMemo(() => StyleSheet.create({
    base: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      alignSelf: 'flex-start',
    },
    text: {
      ...typography.caption1,
      fontWeight: '500',
    },
  }), []);
  return (
    <View style={[styles.base, { backgroundColor: bgColor }, style]} {...props}>
      <Text style={[styles.text, { color: fgColor }]}>{label}</Text>
    </View>
  );
}

export default Tag;
