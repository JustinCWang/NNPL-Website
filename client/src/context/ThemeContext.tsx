'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { themes, type Theme } from '@/lib/themes';

interface ThemeContextType {
  selectedTheme: Theme;
  setSelectedTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-text', selectedTheme.textColor);
    document.documentElement.style.setProperty('--color-bg', selectedTheme.color);
    document.body.style.backgroundColor = selectedTheme.color;
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [selectedTheme]);

  return (
    <ThemeContext.Provider value={{ selectedTheme, setSelectedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};