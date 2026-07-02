import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

interface StageTabsProps {
  stages: string[];
  activeStage: string;
  onStageChange: (stage: string) => void;
}

export function StageTabs({ stages, activeStage, onStageChange }: StageTabsProps) {
  const { width: screenWidth } = useWindowDimensions();
  // 左右留边距后，每个标签等宽
  const sidePadding = spacing.xl * 2;
  const totalGap = spacing.xs * (stages.length - 1);
  const tabWidth = Math.floor((screenWidth - sidePadding - totalGap) / stages.length);
  const colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    tag: {
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.bg,
      borderWidth: 0.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagActive: {
      backgroundColor: colors.fg,
      borderColor: colors.fg,
    },
    tagText: {
      ...typography.callout,
      fontWeight: '500',
      color: colors.muted,
      textAlign: 'center',
    },
    tagTextActive: {
      color: colors.surface,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {stages.map((stage) => (
        <TouchableOpacity
          key={stage}
          style={[
            styles.tag,
            { width: tabWidth },
            activeStage === stage && styles.tagActive,
          ]}
          onPress={() => onStageChange(stage)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tagText, activeStage === stage && styles.tagTextActive]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {stage}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}


export default StageTabs;