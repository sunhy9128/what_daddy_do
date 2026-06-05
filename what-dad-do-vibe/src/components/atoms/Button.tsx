import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { radius, spacing, typography } from '../../styles/tokens';
import { useColors } from '../../context/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  variant?: ButtonVariant;
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

function Button({ variant = 'primary', title, onPress, style, loading, disabled }: ButtonProps) {
  const colors = useColors();
  const variantStyle = {
    primary: { backgroundColor: colors.accent, color: colors.surface },
    secondary: { backgroundColor: colors.bg, color: colors.fg },
    ghost: { backgroundColor: 'transparent', color: colors.accent },
  }[variant];
  const styles = useMemo(() => StyleSheet.create({
    base: {
      minHeight: 44,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      ...typography.callout,
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.6,
    },
  }), [colors]);
  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: variantStyle.backgroundColor },
        (loading || disabled) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.color as string} size="small" />
      ) : (
        <Text style={[styles.text, { color: variantStyle.color }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export default Button;