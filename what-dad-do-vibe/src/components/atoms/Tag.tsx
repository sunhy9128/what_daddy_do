import React, { useMemo } from 'react';
import { Text, StyleSheet, View, ViewProps, TextProps } from 'react-native';
import { radius, spacing, typography } from '../../styles/tokens';
import { useColors } from '../../context/ThemeContext';

type TagVariant = 'default' | 'short' | 'long' | 'success' | 'warning';

interface TagProps extends ViewProps {
  variant?: TagVariant;
  label: string;
}

export function Tag({ variant = 'default', label, style, ...props }: TagProps) {
  const colors = useColors();
  const variantStyle = {
    default: { backgroundColor: colors.bg, color: colors.fg },
    short: { backgroundColor: '#f0f9ff', color: '#007aff' },
    long: { backgroundColor: '#f0fdf4', color: '#34c759' },
    success: { backgroundColor: '#f0fdf4', color: '#34c759' },
    warning: { backgroundColor: '#fef3c7', color: '#d97706' },
  }[variant];
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
    <View style={[styles.base, { backgroundColor: variantStyle.backgroundColor }, style]} {...props}>
      <Text style={[styles.text, { color: variantStyle.color }]}>{label}</Text>
    </View>
  );
}

export default Tag;
