"use client";
/*
  Theme context and provider.
  - Persists the selected theme in localStorage
  - Applies theme values to CSS custom properties on the document root
*/

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultTheme, themes, type Theme } from "@/lib/themes";

interface ThemeContextType {
  selectedTheme: Theme;
  setSelectedTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selectedTheme, setSelectedThemeState] = useState<Theme>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedThemeName = localStorage.getItem("selectedTheme");
      if (savedThemeName) {
        const theme = themes.find((t) => t.name === savedThemeName);
        if (theme) {
          setSelectedThemeState(theme);
        }
      }
    }
  }, []);

  // Save theme to localStorage when it changes
  const setSelectedTheme = (theme: Theme) => {
    setSelectedThemeState(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedTheme", theme.name);
    }
  };

  // Apply theme to document root
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      // Create gradient with transparency for each color
      const gradientColors = selectedTheme.colors
        .map((color, index) => {
          // Vary opacity: lighter colors more transparent, darker colors less transparent
          const opacity = index === 0 ? 0.25 : index === 1 ? 0.3 : index === 2 ? 0.35 : 0.4;
          return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
        })
        .join(", ");
      
      // Set CSS custom properties for the theme
      root.style.setProperty("--theme-gradient", `linear-gradient(135deg, ${gradientColors})`);
      root.style.setProperty("--theme-border-color", selectedTheme.borderColor);
      root.style.setProperty("--theme-text-color", selectedTheme.textColor);
      // Dotted pattern color - use the darkest color with low opacity
      const dotColor = selectedTheme.colors[selectedTheme.colors.length - 1];
      root.style.setProperty("--theme-dot-color", `${dotColor}25`);
    }
  }, [selectedTheme]);

  return (
    <ThemeContext.Provider value={{ selectedTheme, setSelectedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

