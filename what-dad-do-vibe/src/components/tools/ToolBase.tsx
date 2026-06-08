import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ToolDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** 在该阶段列表中隐藏此工具（不填则全阶段可见） */
  hideInStages?: string[];
}

interface ToolBaseProps {
  tool: ToolDefinition;
  children: React.ReactNode;
  onRemove: (id: string) => void;
  showRemove?: boolean;
  showReorder?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  forceCollapsed?: boolean;
}

export function ToolBase({
  tool, children, onRemove,
  showRemove = false,
  showReorder = false,
  isFirst = false, isLast = false,
  onMoveUp, onMoveDown,
  forceCollapsed = false,
}: ToolBaseProps) {
  const colors = useColors();
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = forceCollapsed || collapsed;

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(!collapsed);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      paddingVertical: 0,
      height: 40,
      backgroundColor: colors.surfaceSecondary,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    reorderBtns: {
      flexDirection: 'column',
      gap: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reorderBtn: {
      width: 20,
      height: 13,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reorderBtnDisabled: {
      opacity: 0.3,
    },
    toolName: {
      ...typography.footnote,
      fontWeight: '600',
      color: colors.fg,
    },
    removeBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeIcon: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
    body: {
      padding: spacing.md,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {showReorder && (
            <View style={styles.reorderBtns}>
              <TouchableOpacity
                style={[styles.reorderBtn, isFirst && styles.reorderBtnDisabled]}
                onPress={onMoveUp}
                disabled={isFirst}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="chevron-up" size={10} color={isFirst ? colors.muted : colors.fgSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reorderBtn, isLast && styles.reorderBtnDisabled]}
                onPress={onMoveDown}
                disabled={isLast}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="chevron-down" size={10} color={isLast ? colors.muted : colors.fgSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <Ionicons
            name={tool.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={colors.fg}
          />
          <Text style={styles.toolName}>{tool.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
            size={14}
            color={colors.muted}
          />
          {showRemove && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemove(tool.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      {!isCollapsed && (
        <View style={styles.body}>
          {children}
        </View>
      )}
    </View>
  );
}

// 3-dot pulse 加载动画 — 各工具通用
export function LoadingDot({ delay = 0, size = 8 }: { delay?: number; size?: number }) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1, duration: 600, delay, useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0.3, duration: 600, useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        opacity,
      }}
    />
  );
}

export default ToolBase;
