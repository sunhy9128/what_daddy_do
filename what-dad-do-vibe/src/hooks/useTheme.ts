import { useContext, createContext } from 'react';
import { theme } from '../theme';

const ThemeContext = createContext(theme);

export function useTheme() {
  return theme;
}