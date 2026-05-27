import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { ToolBase, ToolDefinition } from './ToolBase';
import { FeedingTimer } from './FeedingTimer';
import { GrowthTracker } from './GrowthTracker';
import { Pressable } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';

const AVAILABLE_TOOLS: ToolDefinition[] = [
  { id: 'feeding-timer', name: '喂奶计时器', icon: '🍼', description: '记录每次喂奶时间' },
  { id: 'growth-tracker', name: '身高体重', icon: '📏', description: '身高体重生长曲线' },
];

const TOOL_COMPONENTS: Record<string, React.FC<{ userId: string; babyGender?: string }>> = {
  'feeding-timer': FeedingTimer,
  'growth-tracker': GrowthTracker,
};

interface ToolInstance {
  instanceId: string;
  toolId: string;
}

interface ToolbarProps {
  activeTools: ToolInstance[];
  userId: string;
  babyGender?: string;
  onAddTool: (toolId: string) => void;
  onRemoveTool: (instanceId: string) => void;
  onReorder: (tools: ToolInstance[]) => void;
}

export function Toolbar({ activeTools, userId, babyGender, onAddTool, onRemoveTool, onReorder }: ToolbarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const activeToolIds = activeTools.map(t => t.toolId);
  const availableToAdd = AVAILABLE_TOOLS.filter(t => !activeToolIds.includes(t.id));

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= activeTools.length) return;
    const items = [...activeTools];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    onReorder(items);
  };

  return (
    <View style={styles.wrapper}>
      {activeTools.length > 1 && (
        <TouchableOpacity style={styles.reorderToggle} onPress={() => setReorderMode(!reorderMode)}>
          <Text style={styles.reorderText}>{reorderMode ? '完成排序' : '排序工具 ⠿'}</Text>
        </TouchableOpacity>
      )}

      {activeTools.map((inst, index) => {
        const def = AVAILABLE_TOOLS.find(t => t.id === inst.toolId);
        const Component = TOOL_COMPONENTS[inst.toolId];
        if (!def || !Component) return null;
        return (
          <View key={inst.instanceId} style={styles.toolRow}>
            {reorderMode && (
              <View style={styles.reorderBtns}>
                <TouchableOpacity
                  style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                  onPress={() => moveItem(index, -1)}
                  disabled={index === 0}
                >
                  <Text style={styles.moveBtnText}>▲</Text>
                </TouchableOpacity>
                <Text style={styles.moveIndex}>{index + 1}</Text>
                <TouchableOpacity
                  style={[styles.moveBtn, index === activeTools.length - 1 && styles.moveBtnDisabled]}
                  onPress={() => moveItem(index, 1)}
                  disabled={index === activeTools.length - 1}
                >
                  <Text style={styles.moveBtnText}>▼</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.toolContent}>
              <ToolBase tool={def} onRemove={() => onRemoveTool(inst.instanceId)}>
                <Component userId={userId} babyGender={babyGender} />
              </ToolBase>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowPicker(true)}>
        <Text style={styles.addIcon}>+</Text>
        <Text style={styles.addText}>添加工具</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="fade" transparent>
        <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>选择工具</Text>
            {availableToAdd.length === 0 && <Text style={styles.pickerEmpty}>已添加所有可用工具</Text>}
            {availableToAdd.map(tool => (
              <TouchableOpacity key={tool.id} style={styles.pickerItem} onPress={() => { onAddTool(tool.id); setShowPicker(false); }}>
                <Text style={styles.pickerItemIcon}>{tool.icon}</Text>
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

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  reorderToggle: { alignItems: 'center', paddingVertical: spacing.xs },
  reorderText: { ...typography.footnote, color: colors.accent, fontWeight: '500' },
  toolRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.xs },
  toolContent: { flex: 1 },
  reorderBtns: { alignItems: 'center', justifyContent: 'center', gap: 2, width: 28 },
  moveBtn: { width: 28, height: 22, borderRadius: 4, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  moveBtnDisabled: { opacity: 0.3 },
  moveBtnText: { fontSize: 10, color: colors.accent, fontWeight: '700' },
  moveIndex: { ...typography.caption1, color: colors.muted, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: 12, borderStyle: 'dashed' },
  addIcon: { fontSize: 20, color: colors.accent, fontWeight: '600' },
  addText: { ...typography.footnote, color: colors.accent, fontWeight: '500' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  pickerContent: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, width: '100%', maxWidth: 400 },
  pickerTitle: { ...typography.title3, fontWeight: '700', marginBottom: spacing.lg },
  pickerEmpty: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  pickerItemIcon: { fontSize: 28 },
  pickerItemInfo: { flex: 1 },
  pickerItemName: { ...typography.callout, fontWeight: '600' },
  pickerItemDesc: { ...typography.footnote, color: colors.muted, marginTop: 2 },
});

export default Toolbar;
