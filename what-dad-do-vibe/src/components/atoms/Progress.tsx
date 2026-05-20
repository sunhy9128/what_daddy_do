import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';

interface ProgressBarProps extends ViewProps {
  value: number; // 0-100
  showLabel?: boolean;
}

export function ProgressBar({ value, showLabel = false, style, ...props }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <View style={[styles.track, style]} {...props}>
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

interface ProgressRingProps extends ViewProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ value, size = 64, strokeWidth = 5, style, ...props }: ProgressRingProps) {
  const percent = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <View style={[styles.ringContainer, { width: size, height: size }, style]} {...props}>
      <View style={styles.ringSvg}>
        <View style={[styles.ringBg, { width: size, height: size, borderWidth: strokeWidth, borderRadius: size / 2 }]} />
        <View
          style={[
            styles.ringFill,
            {
              width: size,
              height: size,
              borderWidth: strokeWidth,
              borderRadius: size / 2,
              borderColor: colors.accent,
              borderTopColor: 'transparent',
              borderRightColor: percent > 25 ? colors.accent : 'transparent',
              borderBottomColor: percent > 50 ? colors.accent : 'transparent',
              borderLeftColor: percent > 75 ? colors.accent : 'transparent',
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>
      <Text style={styles.ringText}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ringBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderColor: colors.border,
  },
  ringFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ringText: {
    ...typography.title3,
    fontWeight: '600',
  },
});

export default ProgressBar;