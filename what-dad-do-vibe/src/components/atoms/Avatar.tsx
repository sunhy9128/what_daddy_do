import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, typography } from '../../styles/tokens';

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

export function Avatar({ name, size = 'medium', backgroundColor = colors.accent, style, ...props }: AvatarProps) {
  const sizeStyle = sizes[size];
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={[styles.base, { width: sizeStyle.width, height: sizeStyle.height, backgroundColor }, style]} {...props}>
      <Text style={[styles.text, { fontSize: sizeStyle.fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.surface,
    fontWeight: '600',
  },
});

export default Avatar;