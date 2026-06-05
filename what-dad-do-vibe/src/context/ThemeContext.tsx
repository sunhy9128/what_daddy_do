import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors, darkColors, ColorScheme } from '../styles/tokens';

const THEME_KEY = 'dadcare_theme_preference';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  /** Whether dark mode is currently active (resolved) */
  isDark: boolean;
  /** User's preference: 'system' | 'light' | 'dark' */
  themeMode: ThemeMode;
  /** Resolved color palette for the current theme */
  colors: ColorScheme;
  /** Set theme preference */
  setThemeMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark (drops 'system' to explicit) */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  // Resolve effective dark mode
  const isDark = themeMode === 'system'
    ? deviceScheme === 'dark'
    : themeMode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  // Load persisted preference on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
        }
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, []);

  // Persist when changed
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  if (!loaded) {
    // Return colors immediately (light as fallback) so UI doesn't flash
    return (
      <ThemeContext.Provider value={{ isDark: false, themeMode: 'system', colors: lightColors, setThemeMode, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, colors, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/** Convenience hook: returns only the resolved color palette */
export function useColors(): ColorScheme {
  return useTheme().colors;
}
