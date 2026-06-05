import { useEffect, Suspense } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AppProvider } from '../src/context/AppContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { WebScrollbarStyle } from '../src/components/WebScrollbarStyle';

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

function StatusBarManager() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
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
            </Suspense>
            <WebScrollbarStyle />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="baby-info" />
              <Stack.Screen name="congratulations" />
              <Stack.Screen name="profile-edit" />
            </Stack>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}