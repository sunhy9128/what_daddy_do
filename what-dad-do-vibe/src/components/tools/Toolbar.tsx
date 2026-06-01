import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, StyleSheet } from 'react-native';
import { ToolBase, ToolDefinition } from './ToolBase';
import { FeedingTimer } from './FeedingTimer';
import { GrowthTracker } from './GrowthTracker';
import { VaccineTracker } from './VaccineTracker';
import { VaccineCalendar } from './VaccineCalendar';
import { FoodSafetyTool } from './FoodSafety';
import { Pressable } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';

const AVAILABLE_TOOLS: ToolDefinition[] = [
  { id: 'feeding-timer', name: '喂奶计时器', icon: '🍼', description: '记录每次喂奶时间' },
  { id: 'growth-tracker', name: '身高体重', icon: '📏', description: '身高体重生长曲线' },
  { id: 'vaccine-tracker', name: '疫苗本', icon: '💉', description: '疫苗接种记录和提醒' },
  { id: 'vaccine-calendar', name: '疫苗日历', icon: '📅', description: '按月查看疫苗接种时间线' },
  { id: 'food-safety', name: '食物禁忌', icon: '🍽️', description: '孕期+婴儿食物安全查询' },
];

const TOOL_COMPONENTS: Record<string, React.FC<{ userId: string; babyGender?: string }>> = {
  'feeding-timer': FeedingTimer,
  'growth-tracker': GrowthTracker,
  'vaccine-tracker': VaccineTracker,
  'vaccine-calendar': VaccineCalendar,
  'food-safety': FoodSafetyTool,
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { dragY.setValue(0); },
      onPanResponderMove: (_, g) => {
        const idx = dragIdxRef.current;
        if (idx === null) return;
        dragY.setValue(g.dy);
        const h = 60;
        if (g.dy > h * 0.35 && idx < activeTools.length - 1) {
          const items = [...activeTools];
          [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
          dragIdxRef.current = idx + 1;
          setDragIndex(idx + 1);
          dragY.setValue(g.dy - h);
          onReorder(items);
        } else if (g.dy < -h * 0.35 && idx > 0) {
          const items = [...activeTools];
          [items[idx], items[idx - 1]] = [items[idx - 1], items[idx]];
          dragIdxRef.current = idx - 1;
          setDragIndex(idx - 1);
          dragY.setValue(g.dy + h);
          onReorder(items);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        dragIdxRef.current = null;
        setDragIndex(null);
      },
    })
  ).current;

  const activeToolIds = activeTools.map(t => t.toolId);
  const availableToAdd = AVAILABLE_TOOLS.filter(t => !activeToolIds.includes(t.id));

  return (
    <View style={styles.wrapper}>
      {activeTools.map((inst, index) => {
        const def = AVAILABLE_TOOLS.find(t => t.id === inst.toolId);
        const Component = TOOL_COMPONENTS[inst.toolId];
        if (!def || !Component) return null;
        const isDragging = dragIndex === index;
        return (
          <Animated.View
            key={inst.instanceId}
            style={[
              styles.toolItem,
              isDragging && {
                zIndex: 999,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                transform: [{ translateY: isDragging ? dragY : 0 }],
              },
            ]}
          >
            <ToolBase
              tool={def}
              onRemove={() => onRemoveTool(inst.instanceId)}
              onDragStart={() => { dragIdxRef.current = index; setDragIndex(index); dragY.setValue(0); }}
              isDragging={isDragging}
              dragHandlers={panResponder.panHandlers}
            >
              <Component userId={userId} babyGender={babyGender} />
            </ToolBase>
          </Animated.View>
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
  wrapper: { paddingHorizontal: spacing.lg },
  toolItem: { marginBottom: spacing.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: 12, borderStyle: 'dashed', marginTop: spacing.sm },
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
