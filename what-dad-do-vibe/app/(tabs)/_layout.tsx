import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthGuard } from '../../src/components/AuthGuard';
import { colors } from '../../src/styles/tokens';

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  tasks: 'list',
  records: 'time',
  community: 'people',
  profile: 'person',
};

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 60 : 56,
        },
      })}>
        <Tabs.Screen name="index" options={{ title: '首页' }} />
        <Tabs.Screen name="tasks" options={{ title: '任务' }} />
        <Tabs.Screen name="records" options={{ title: '记录' }} />
        <Tabs.Screen name="community" options={{ title: '社区' }} />
        <Tabs.Screen name="profile" options={{ title: '我的' }} />
      </Tabs>
    </AuthGuard>
  );
}
