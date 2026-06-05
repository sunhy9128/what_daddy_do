import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

interface CollapsibleGroupProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  /** 首次展开时触发（用于懒加载） */
  onInit?: () => void;
  /** 容器 ref（用于外部测量位置） */
  containerRef?: React.Ref<View>;
}

export function CollapsibleGroup({ title, count, defaultExpanded = true, children, onInit, containerRef }: CollapsibleGroupProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const initedRef = useRef(false);

  // 首次展开时触发 onInit
  useEffect(() => {
    if (expanded && !initedRef.current) {
      initedRef.current = true;
      onInit?.();
    }
  }, [expanded, onInit]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      backgroundColor: colors.surfaceSecondary,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      ...typography.callout,
      fontWeight: '600',
    },
    badge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    badgeText: {
      ...typography.footnote,
      fontWeight: '600',
      color: colors.surface,
    },
    arrow: {
      fontSize: 16,
      color: colors.muted,
    },
    content: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
  }), [colors]);

  return (
    <View ref={containerRef} style={styles.container} collapsable={false}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

export default CollapsibleGroup;
