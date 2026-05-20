import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing, typography } from '../../styles/tokens';

interface StageTabsProps {
  stages: string[];
  activeStage: string;
  onStageChange: (stage: string) => void;
}

export function StageTabs({ stages, activeStage, onStageChange }: StageTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {stages.map((stage) => (
        <TouchableOpacity
          key={stage}
          style={[styles.tag, activeStage === stage && styles.tagActive]}
          onPress={() => onStageChange(stage)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tagText, activeStage === stage && styles.tagTextActive]}>
            {stage}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  tagActive: {
    backgroundColor: colors.fg,
    borderColor: colors.fg,
  },
  tagText: {
    ...typography.callout,
    fontWeight: '500',
    color: colors.muted,
  },
  tagTextActive: {
    color: colors.surface,
  },
});

export default StageTabs;