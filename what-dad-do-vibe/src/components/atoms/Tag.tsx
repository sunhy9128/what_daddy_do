import React, { useMemo } from 'react';
import { Text, StyleSheet, View, ViewProps } from 'react-native';
import { radius, spacing, typography, colors as palette, darkColors } from '../../styles/tokens';
import { useColors, useTheme } from '../../context/ThemeContext';

type TagVariant = 'default' | 'short' | 'long' | 'success' | 'warning';

interface TagProps extends ViewProps {
  variant?: TagVariant;
  label: string;
}

const VARIANT_STYLES: Record<TagVariant, { bg: string; fg: string }> = {
  default: { bg: '', fg: '' }, // handled by theme
  short: { bg: '#EAEDEF', fg: palette.info },
  long: { bg: '#EFF0E6', fg: palette.success },
  success: { bg: '#EFF0E6', fg: palette.success },
  warning: { bg: palette.warningSurface, fg: palette.warningFg },
};

const DARK_VARIANT_STYLES: Record<TagVariant, { bg: string; fg: string }> = {
  default: { bg: '', fg: '' },
  short: { bg: '#232B2E', fg: darkColors.info },
  long: { bg: '#242A1E', fg: darkColors.success },
  success: { bg: '#242A1E', fg: darkColors.success },
  warning: { bg: darkColors.warningSurface, fg: darkColors.warningFg },
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
