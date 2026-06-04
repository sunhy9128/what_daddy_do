import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../styles/tokens';

interface SegmentControlProps {
  segments: string[];
  activeSegment: string;
  onSegmentChange: (segment: string) => void;
}

export function SegmentControl({ segments, activeSegment, onSegmentChange }: SegmentControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((segment) => (
        <TouchableOpacity
          key={segment}
          style={[styles.segment, activeSegment === segment && styles.segmentActive]}
          onPress={() => onSegmentChange(segment)}
          activeOpacity={0.7}
        >
          <Text style={[styles.text, activeSegment === segment && styles.textActive]}>
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 4,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  text: {
    ...typography.footnote,
    fontWeight: '500',
    color: colors.muted,
  },
  textActive: {
    color: colors.fg,
  },
});

export default SegmentControl;