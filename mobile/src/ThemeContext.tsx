import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK, LIGHT, ThemeTokens } from './theme';
import { THEME_KEY } from './constants';

type ThemeName = 'dark' | 'light';

type ThemeContextValue = {
  theme: ThemeName;
  T: ThemeTokens;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'dark' || v === 'light') setTheme(v);
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      T: theme === 'light' ? LIGHT : DARK,
      toggleTheme: () => {
        setTheme((prev) => {
          const next = prev === 'dark' ? 'light' : 'dark';
          AsyncStorage.setItem(THEME_KEY, next);
          return next;
        });
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
