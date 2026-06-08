import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, Animated, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../styles/tokens';
import { AVAILABLE_TOOLS } from './Toolbar';

const RIPPLE_DURATION = 350;
const RIPPLE_SIZE = 180;

interface ToolGridItem {
  instanceId: string;
  toolId: string;
}

interface ToolGridProps {
  tools: ToolGridItem[];
  currentStage?: string;
  onToolPress: (toolId: string) => void;
  onAddTool: (toolId: string) => void;
  onRemoveTool?: (instanceId: string) => void;
}

export function ToolGrid({ tools, currentStage, onToolPress, onAddTool, onRemoveTool }: ToolGridProps) {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);

  const [deleteReveal, setDeleteReveal] = useState<string | null>(null);
  const [deleteReady, setDeleteReady] = useState(false);
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const deleteTargetRef = useRef<string | null>(null);

  const startReveal = useCallback((instanceId: string) => {
    deleteTargetRef.current = instanceId;
    setDeleteReveal(instanceId);
    setDeleteReady(false);
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: RIPPLE_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setDeleteReady(true);
    });
  }, [rippleAnim]);

  const resetReveal = useCallback(() => {
    rippleAnim.setValue(0);
    setDeleteReveal(null);
    setDeleteReady(false);
    deleteTargetRef.current = null;
  }, [rippleAnim]);

  const handleDeleteConfirm = useCallback(() => {
    const id = deleteTargetRef.current;
    if (id && onRemoveTool) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onRemoveTool(id);
    }
    resetReveal();
  }, [onRemoveTool, resetReveal]);

  const handleAddFromPicker = useCallback((id: string) => {
    onAddTool(id);
    setShowPicker(false);
  }, [onAddTool]);

  const toolDefMap = useMemo(() => {
    const map: Record<string, (typeof AVAILABLE_TOOLS)[0]> = {};
    AVAILABLE_TOOLS.forEach(t => { map[t.id] = t; });
    return map;
  }, []);

  const activeToolIds = useMemo(() => new Set(tools.map(t => t.toolId)), [tools]);
  const availableToAdd = useMemo(
    () => AVAILABLE_TOOLS.filter(t => {
      if (activeToolIds.has(t.id)) return false;
      if (t.hideInStages && currentStage && t.hideInStages.includes(currentStage)) return false;
      return true;
    }),
    [activeToolIds, currentStage]
  );

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.6, 0.6, 1],
  });

  const renderToolItem = (item: ToolGridItem) => {
    const def = toolDefMap[item.toolId];
    if (!def) return null;
    const isRevealing = deleteReveal === item.instanceId;

    return (
      <View key={item.instanceId} style={styles.gridItem}>
        {isRevealing && deleteReady ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={handleDeleteConfirm}
          >
            <Ionicons name="trash-outline" size={28} color="#fff" />
            <Text style={styles.deleteLabel}>删除</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <TouchableOpacity
              style={styles.gridBtn}
              activeOpacity={0.7}
              onPress={isRevealing ? resetReveal : () => onToolPress(item.toolId)}
              onLongPress={() => !isRevealing && startReveal(item.instanceId)}
              delayLongPress={400}
            >
              <Ionicons name={def.icon as keyof typeof Ionicons.glyphMap} size={28} color={colors.accent} />
              <Text style={styles.gridLabel} numberOfLines={1}>{def.name}</Text>
            </TouchableOpacity>
            {isRevealing && (
              <View style={styles.rippleLayer} pointerEvents="none">
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [{ scaleX: rippleScale }, { scaleY: rippleScale }],
                      opacity: rippleOpacity,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    section: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.callout,
      fontWeight: '600',
      color: colors.fg,
      marginBottom: spacing.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.xs,
      zIndex: 2,
    },
    gridItem: {
      width: '33.333%',
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.sm,
    },
    gridBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xs,
      aspectRatio: 1,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    gridLabel: {
      ...typography.caption1,
      color: colors.fgSecondary,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 14,
      marginTop: spacing.xs,
    },
    addBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      aspectRatio: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    addLabel: {
      ...typography.caption1,
      color: colors.muted,
      marginTop: spacing.xs,
      fontWeight: '500',
    },
    rippleLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    rippleCircle: {
      position: 'absolute',
      width: RIPPLE_SIZE,
      height: RIPPLE_SIZE,
      borderRadius: RIPPLE_SIZE / 2,
      backgroundColor: colors.error,
    },
    deleteBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.error,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xs,
      aspectRatio: 1,
    },
    deleteLabel: {
      ...typography.caption1,
      fontWeight: '600',
      color: '#fff',
      marginTop: spacing.xs,
    },
    dismissOverlay: {
      position: 'absolute',
      top: -200,
      left: -200,
      right: -200,
      bottom: -200,
      zIndex: 1,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    pickerContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 400,
    },
    pickerTitle: {
      ...typography.title3,
      fontWeight: '700',
      marginBottom: spacing.lg,
    },
    pickerEmpty: {
      ...typography.callout,
      color: colors.muted,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    pickerItemInfo: { flex: 1 },
    pickerItemName: { ...typography.callout, fontWeight: '600' },
    pickerItemDesc: { ...typography.footnote, color: colors.muted, marginTop: 2 },
  }), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>工具箱</Text>
      <View style={{ position: 'relative', overflow: 'visible' }}>
        {deleteReady && (
          <Pressable style={styles.dismissOverlay} onPress={resetReveal} />
        )}
        <View style={styles.grid}>
          {tools.map(renderToolItem)}
          <View style={styles.gridItem}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={deleteReveal ? resetReveal : () => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color={colors.muted} />
              <Text style={styles.addLabel}>添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showPicker} animationType="fade" transparent>
        <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>选择工具</Text>
            {availableToAdd.length === 0 && (
              <Text style={styles.pickerEmpty}>已添加所有可用工具</Text>
            )}
            {availableToAdd.map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={styles.pickerItem}
                onPress={() => handleAddFromPicker(tool.id)}
              >
                <Ionicons name={tool.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.accent} />
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemName}>{tool.name}</Text>
                  <Text style={styles.pickerItemDesc}>{tool.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default ToolGrid;
