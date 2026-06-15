import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, Animated, LayoutAnimation, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../styles/tokens';
import { AVAILABLE_TOOLS } from './Toolbar';

const RIPPLE_DURATION = 350;
const RIPPLE_SIZE = 180;
const PAGE_SIZE = 9; // 3 行 × 3 列（主页九宫格）
const PICKER_PAGE_SIZE = 8; // 选择器每页显示工具数

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
  const [page, setPage] = useState(0);
  const [pickerPage, setPickerPage] = useState(0);

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
    setPickerPage(0);
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

  // ─── 分页计算 ───
  const totalPages = useMemo(() => {
    const totalItems = tools.length + 1; // +1 为添加按钮
    return Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  }, [tools.length]);

  // 当前页显示的工具 + 添加按钮
  const pageContent = useMemo(() => {
    const start = page * PAGE_SIZE;
    let remainingSlots = PAGE_SIZE;
    const items: ({ type: 'tool'; tool: ToolGridItem } | { type: 'add' })[] = [];

    // 工具
    for (let i = start; i < tools.length && remainingSlots > 0; i++, remainingSlots--) {
      items.push({ type: 'tool', tool: tools[i] });
    }

    // 添加按钮（仅最后一页）
    if (page === totalPages - 1 && remainingSlots > 0) {
      items.push({ type: 'add' });
    }

    return items;
  }, [tools, page, totalPages]);

  // 切页时重置删除状态
  const goToPage = useCallback((p: number) => {
    resetReveal();
    setPage(p);
  }, [resetReveal]);

  // ─── 选择器分页计算 ───
  const pickerTotalPages = useMemo(
    () => Math.max(1, Math.ceil(availableToAdd.length / PICKER_PAGE_SIZE)),
    [availableToAdd.length]
  );
  const pickerPageTools = useMemo(
    () => availableToAdd.slice(pickerPage * PICKER_PAGE_SIZE, (pickerPage + 1) * PICKER_PAGE_SIZE),
    [availableToAdd, pickerPage]
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
    // ─── 分页指示器 ───
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
    },
    pageDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    pageDotActive: {
      width: 24,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    pageBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pageBtnDisabled: {
      opacity: 0.25,
    },
    pageBtnText: {
      ...typography.caption1,
      color: colors.accent,
      fontWeight: '600',
    },
    // ─── Picker ───
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
    pickerPagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.md,
      marginTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    pickerPageBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
  }), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>工具箱</Text>
      <View style={{ position: 'relative', overflow: 'visible' }}>
        {deleteReady && (
          <Pressable style={styles.dismissOverlay} onPress={resetReveal} />
        )}
        <View style={styles.grid}>
          {pageContent.map(item =>
            item.type === 'tool'
              ? renderToolItem(item.tool)
              : (
                <View key="add-btn" style={styles.gridItem}>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={deleteReveal ? resetReveal : () => { setShowPicker(true); setPickerPage(0); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={28} color={colors.muted} />
                    <Text style={styles.addLabel}>添加</Text>
                  </TouchableOpacity>
                </View>
              )
          )}
        </View>
      </View>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={() => goToPage(page - 1)}
            disabled={page === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color={page === 0 ? colors.muted : colors.accent} />
          </TouchableOpacity>

          {Array.from({ length: totalPages }).map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.pageDot, i === page && styles.pageDotActive]}
              onPress={() => goToPage(i)}
              activeOpacity={0.7}
            />
          ))}

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => goToPage(page + 1)}
            disabled={page >= totalPages - 1}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={16} color={page >= totalPages - 1 ? colors.muted : colors.accent} />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showPicker} animationType="fade" transparent>
        <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>选择工具</Text>
            {availableToAdd.length === 0 && (
              <Text style={styles.pickerEmpty}>已添加所有可用工具</Text>
            )}
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {pickerPageTools.map(tool => (
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
            </ScrollView>
            {pickerTotalPages > 1 && (
              <View style={styles.pickerPagination}>
                <TouchableOpacity
                  style={[styles.pickerPageBtn, pickerPage === 0 && styles.pageBtnDisabled]}
                  onPress={() => setPickerPage(p => Math.max(0, p - 1))}
                  disabled={pickerPage === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={pickerPage === 0 ? colors.muted : colors.accent} />
                </TouchableOpacity>
                {Array.from({ length: pickerTotalPages }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.pageDot, i === pickerPage && styles.pageDotActive]}
                    onPress={() => setPickerPage(i)}
                    activeOpacity={0.7}
                  />
                ))}
                <TouchableOpacity
                  style={[styles.pickerPageBtn, pickerPage >= pickerTotalPages - 1 && styles.pageBtnDisabled]}
                  onPress={() => setPickerPage(p => Math.min(pickerTotalPages - 1, p + 1))}
                  disabled={pickerPage >= pickerTotalPages - 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={16} color={pickerPage >= pickerTotalPages - 1 ? colors.muted : colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default ToolGrid;
