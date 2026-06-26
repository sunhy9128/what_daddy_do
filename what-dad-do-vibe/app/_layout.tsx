import { useEffect, Suspense } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AppProvider, useApp } from '../src/context/AppContext';
import { ThemeProvider, useTheme, useColors } from '../src/context/ThemeContext';
import { WebScrollbarStyle } from '../src/components/WebScrollbarStyle';
import { loadOnboardingCompleted } from '../src/lib/storage';

function AuthRedirector() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';

    if (!session && inTabsGroup) {
      router.replace('/login');
    } else if (session && inLogin) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return null;
}

// 已登录用户首次进入 (tabs) 时，若未完成新手引导则重定向到 /onboarding
function OnboardingRedirector() {
  const { user } = useAuth();
  const { state } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!user || state.loading) return;
    const inTabs = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    if (inTabs && !inOnboarding) {
      loadOnboardingCompleted(user.id).then(done => {
        if (!done) router.replace('/onboarding');
      });
    }
  }, [user, state.loading, segments, router]);

  return null;
}

function StatusBarManager() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function StackNavigator() {
  const colors = useColors();
  const { isDark } = useTheme();
  return (
    <>
      <WebScrollbarStyle isDark={isDark} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="baby-info" />
        <Stack.Screen name="congratulations" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="tool-detail" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <StatusBarManager />
            <Suspense fallback={null}>
              <AuthRedirector />
              <OnboardingRedirector />
            </Suspense>
            <StackNavigator />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
