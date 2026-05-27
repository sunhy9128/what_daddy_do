import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';

export interface ToolDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ToolBaseProps {
  tool: ToolDefinition;
  children: React.ReactNode;
  onRemove: (id: string) => void;
}

export function ToolBase({ tool, children, onRemove }: ToolBaseProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.dragHandle}>⠿</Text>
          <Text style={styles.toolIcon}>{tool.icon}</Text>
          <Text style={styles.toolName}>{tool.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.collapseIcon}>{collapsed ? '▶' : '▼'}</Text>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(tool.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {!collapsed && (
        <View style={styles.body}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    gap: spacing.sm,
  },
  dragHandle: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: '600',
  },
  collapseIcon: {
    fontSize: 10,
    color: colors.muted,
  },
  toolIcon: {
    fontSize: 18,
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
    backgroundColor: colors.surfaceSecondary,
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
    minHeight: 200,
  },
});

export default ToolBase;
