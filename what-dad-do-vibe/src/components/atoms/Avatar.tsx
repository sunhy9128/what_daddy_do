import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { radius, typography } from '../../styles/tokens';
import { useColors } from '../../context/ThemeContext';

interface AvatarProps extends ViewProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

const sizes = {
  small: { width: 32, height: 32, fontSize: 12 },
  medium: { width: 40, height: 40, fontSize: 16 },
  large: { width: 56, height: 56, fontSize: 20 },
};

export function Avatar({ name, size = 'medium', backgroundColor: bgColor, style, ...props }: AvatarProps) {
  const colors = useColors();
  const backgroundColor = bgColor ?? colors.accent;
  const sizeStyle = sizes[size];
  const initial = name.charAt(0).toUpperCase();

  const styles = useMemo(() => StyleSheet.create({
    base: {
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: colors.surface,
      fontWeight: '600',
    },
  }), [colors]);

  return (
    <View style={[styles.base, { width: sizeStyle.width, height: sizeStyle.height, backgroundColor }, style]} {...props}>
      <Text style={[styles.text, { fontSize: sizeStyle.fontSize }]}>{initial}</Text>
    </View>
  );
}

export default Avatar;