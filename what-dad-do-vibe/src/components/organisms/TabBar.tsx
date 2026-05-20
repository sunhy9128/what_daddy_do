import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, spacing, typography } from '../../styles/tokens';

interface TabItem {
  key: string;
  label: string;
  icon: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => onTabChange(tab.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.icon, activeTab === tab.key && styles.iconActive]}>
            {tab.icon}
          </Text>
          <Text style={[styles.label, activeTab === tab.key && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : spacing.sm,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.85)' : colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabActive: {},
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  iconActive: {},
  label: {
    ...typography.caption2,
    color: colors.muted,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});

export default TabBar;