import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, LayoutAnimation, Platform, UIManager, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Android 启用 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { ToolBase, ToolDefinition } from './ToolBase';
import { FeedingTimer } from './FeedingTimer';
import { GrowthTracker } from './GrowthTracker';
import { VaccineTracker } from './VaccineTracker';
import { VaccineCalendar } from './VaccineCalendar';
import { FoodSafetyTool } from './FoodSafety';
import { PrenatalTimeline } from './PrenatalTimeline';
import { ContractionTimer } from './ContractionTimer';
import { KickCounter } from './KickCounter';
import { MomWeightTracker } from './MomWeightTracker';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  { id: 'feeding-timer', name: '喂奶计时器', icon: 'timer-outline', description: '记录每次喂奶时间' },
  { id: 'growth-tracker', name: '宝宝身高体重', icon: 'trending-up-outline', description: '宝宝身高体重生长曲线' },
  { id: 'vaccine-tracker', name: '疫苗本', icon: 'medkit-outline', description: '疫苗接种记录和提醒' },
  { id: 'vaccine-calendar', name: '疫苗日历', icon: 'calendar-outline', description: '按月查看疫苗接种时间线' },
  { id: 'food-safety', name: '食物禁忌', icon: 'restaurant-outline', description: '孕期+婴儿食物安全查询' },
  { id: 'prenatal-timeline', name: '产检时间轴', icon: 'checkmark-circle-outline', description: '标准产检流程及完成进度' },
  { id: 'contraction-timer', name: '宫缩计时器', icon: 'fitness-outline', description: '记录宫缩持续时间和间隔' },
  { id: 'kick-counter', name: '胎动计数器', icon: 'pulse-outline', description: '记录胎动次数和时段' },
  { id: 'mom-weight', name: '妈妈体重记录', icon: 'scale-outline', description: '孕期体重记录及增长曲线' },
];

const TOOL_COMPONENTS: Record<string, React.FC<{ userId: string; babyGender?: string }>> = {
  'feeding-timer': FeedingTimer,
  'growth-tracker': GrowthTracker,
  'vaccine-tracker': VaccineTracker,
  'vaccine-calendar': VaccineCalendar,
  'food-safety': FoodSafetyTool,
  'prenatal-timeline': PrenatalTimeline,
  'contraction-timer': ContractionTimer,
  'kick-counter': KickCounter,
  'mom-weight': MomWeightTracker,
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
  /** wrapper ref（用于外部测量位置） */
  wrapperRef?: React.Ref<View>;
}

export function Toolbar({ activeTools, userId, babyGender, onAddTool, onRemoveTool, onReorder, wrapperRef }: ToolbarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [reordering, setReordering] = useState(false);
  const colors = useColors();

  const moveUp = (index: number) => {
    if (index <= 0) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const items = [...activeTools];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    onReorder(items);
  };

  const moveDown = (index: number) => {
    if (index >= activeTools.length - 1) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const items = [...activeTools];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    onReorder(items);
  };

  const activeToolIds = activeTools.map(t => t.toolId);
  const availableToAdd = AVAILABLE_TOOLS.filter(t => !activeToolIds.includes(t.id));

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { paddingHorizontal: spacing.lg },
    footerRow: {
      flexDirection: 'row', gap: spacing.sm,
      marginTop: spacing.sm,
    },
    footerBtn: {
      flex: 1,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 4,
      height: 40,
      borderRadius: radius.sm,
      borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    footerBtnActive: {
      backgroundColor: colors.accent, borderColor: colors.accent,
    },

    footerBtnText: {
      ...typography.footnote, color: colors.accent, fontWeight: '500',
    },
    footerBtnTextActive: {
      color: '#fff',
    },
    toolItem: { marginBottom: spacing.sm },
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    pickerContent: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, width: '100%', maxWidth: 400 },
    pickerTitle: { ...typography.title3, fontWeight: '700', marginBottom: spacing.lg },
    pickerEmpty: { ...typography.callout, color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
    pickerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    pickerItemIcon: { fontSize: 28 },
    pickerItemInfo: { flex: 1 },
    pickerItemName: { ...typography.callout, fontWeight: '600' },
    pickerItemDesc: { ...typography.footnote, color: colors.muted, marginTop: 2 },
  }), [colors]);

  return (
    <View ref={wrapperRef} style={styles.wrapper} collapsable={false}>
      {/* 工具列表 */}
      {activeTools.map((inst, index) => {
        const def = AVAILABLE_TOOLS.find(t => t.id === inst.toolId);
        const Component = TOOL_COMPONENTS[inst.toolId];
        if (!def || !Component) return null;
        const isFirst = index === 0;
        const isLast = index === activeTools.length - 1;
        return (
          <View key={inst.instanceId} style={styles.toolItem}>
            <ToolBase
              tool={def}
              onRemove={() => onRemoveTool(inst.instanceId)}
              showRemove={reordering}
              showReorder={reordering}
              isFirst={isFirst}
              isLast={isLast}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
              forceCollapsed={reordering}
            >
              <Component userId={userId} babyGender={babyGender} />
            </ToolBase>
          </View>
        );
      })}

      {/* 底部操作栏 */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="add" size={18} color={colors.accent} />
          <Text style={styles.footerBtnText}>添加工具</Text>
        </TouchableOpacity>
        {(activeTools.length > 0 || reordering) && (
          <TouchableOpacity
            style={[styles.footerBtn, reordering && styles.footerBtnActive]}
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setReordering(!reordering); }}
          >
            <Ionicons
              name={reordering ? 'checkmark-circle' : 'swap-vertical-outline'}
              size={16}
              color={reordering ? '#fff' : colors.accent}
            />
            <Text style={[styles.footerBtnText, reordering && styles.footerBtnTextActive]}>
              {reordering ? '完成' : '编辑'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showPicker} animationType="fade" transparent>
        <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>选择工具</Text>
            {availableToAdd.length === 0 && <Text style={styles.pickerEmpty}>已添加所有可用工具</Text>}
            {availableToAdd.map(tool => (
              <TouchableOpacity key={tool.id} style={styles.pickerItem} onPress={() => { onAddTool(tool.id); setShowPicker(false); }}>
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

export default Toolbar;
