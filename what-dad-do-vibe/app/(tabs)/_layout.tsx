import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthGuard } from '../../src/components/AuthGuard';
import { colors, spacing } from '../../src/styles/tokens';

// iOS SF Symbols 风格图标映射 — outline 非激活 / filled 激活
const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  tasks: 'checkbox-outline',
  community: 'chatbubbles-outline',
  profile: 'person-outline',
};

const tabIconsActive: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  tasks: 'checkbox',
  community: 'chatbubbles',
  profile: 'person',
};

const tabLabels: Record<string, string> = {
  index: '首页',
  tasks: '任务',
  community: '社区',
  profile: '我的',
};

function TabIcon({ routeName, color, size, focused }: { routeName: string; color: string; size: number; focused: boolean }) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons
        name={focused ? tabIconsActive[routeName] : tabIcons[routeName]}
        size={focused ? size + 2 : size}
        color={color}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size, focused }) => (
          <TabIcon routeName={route.name} color={color} size={size} focused={focused} />
        ),
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      })}>
        <Tabs.Screen name="index" options={{ title: tabLabels.index }} />
        <Tabs.Screen name="tasks" options={{ title: tabLabels.tasks }} />
        <Tabs.Screen name="community" options={{ title: tabLabels.community }} />
        <Tabs.Screen name="profile" options={{ title: tabLabels.profile }} />
        <Tabs.Screen name="records" options={{ href: null }} />
      </Tabs>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 72 : 60,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.xs,
    // Kami 柔和顶阴影替代硬边框
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabBarItem: {
    paddingVertical: 0,
  },
  iconWrapper: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconWrapperActive: {
    backgroundColor: colors.accentLight,
  },
});
