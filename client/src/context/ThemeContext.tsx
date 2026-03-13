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

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const parsed = Number.parseInt(fullHex, 16);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function toRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getContrastTextColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return "#111827";
  }

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.42 ? "#111827" : "#f8fafc";
}

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
      const lightColor = selectedTheme.colors[0] ?? selectedTheme.borderColor;
      const midColor = selectedTheme.colors[1] ?? selectedTheme.borderColor;
      const deepColor = selectedTheme.colors[selectedTheme.colors.length - 1] ?? selectedTheme.textColor;
      const isDarkTheme = selectedTheme.name === "dark";
      const surfaceTextColor = selectedTheme.ui.text || getContrastTextColor(lightColor);
      const accentTextColor = selectedTheme.ui.buttonText || getContrastTextColor(selectedTheme.ui.button);

      // Create gradient with transparency for each color
      const gradientColors = selectedTheme.colors
        .map((color, index) => {
          // Dark theme needs a denser page background so it doesn't read like light mode behind dark cards.
          const opacity = isDarkTheme
            ? index === 0
              ? 0.68
              : index === 1
                ? 0.74
                : index === 2
                  ? 0.82
                  : 0.92
            : index === 0
              ? 0.25
              : index === 1
                ? 0.3
                : index === 2
                  ? 0.35
                  : 0.4;
          return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
        })
        .join(", ");
      
      root.dataset.theme = selectedTheme.name;
      // Set CSS custom properties for the theme
      root.style.setProperty("--theme-background-base", isDarkTheme ? "#12181f" : "#ffffff");
      root.style.setProperty("--theme-gradient", `linear-gradient(135deg, ${gradientColors})`);
      root.style.setProperty("--theme-border-color", selectedTheme.borderColor);
      root.style.setProperty("--theme-text-color", selectedTheme.textColor);
      root.style.setProperty("--theme-surface-solid", selectedTheme.ui.surface);
      root.style.setProperty(
        "--theme-surface-gradient",
        `linear-gradient(160deg, ${selectedTheme.ui.surfaceStrong}, ${selectedTheme.ui.surface}, ${toRgba(midColor, 0.1)})`
      );
      root.style.setProperty("--theme-surface-strong", selectedTheme.ui.surfaceStrong);
      root.style.setProperty("--theme-input-bg", selectedTheme.ui.input);
      root.style.setProperty("--theme-border-soft", toRgba(selectedTheme.borderColor, 0.28));
      root.style.setProperty("--theme-border-strong", toRgba(selectedTheme.borderColor, 0.46));
      root.style.setProperty("--theme-focus-ring", toRgba(selectedTheme.borderColor, 0.24));
      root.style.setProperty("--theme-shadow-color", toRgba(deepColor, isDarkTheme ? 0.32 : 0.16));
      root.style.setProperty("--theme-surface-text", surfaceTextColor);
      root.style.setProperty("--theme-surface-muted", selectedTheme.ui.mutedText);
      root.style.setProperty("--theme-placeholder-color", toRgba(selectedTheme.ui.mutedText, 0.7));
      root.style.setProperty(
        "--theme-button-gradient",
        `linear-gradient(135deg, ${selectedTheme.ui.button}, ${selectedTheme.borderColor})`
      );
      root.style.setProperty(
        "--theme-button-gradient-hover",
        `linear-gradient(135deg, ${selectedTheme.ui.buttonHover}, ${selectedTheme.ui.button})`
      );
      root.style.setProperty("--theme-button-text", accentTextColor);
      root.style.setProperty("--theme-chip-bg", toRgba(selectedTheme.borderColor, isDarkTheme ? 0.18 : 0.12));
      root.style.setProperty("--theme-chip-strong", toRgba(selectedTheme.borderColor, isDarkTheme ? 0.26 : 0.2));
      root.style.setProperty("--theme-overlay-color", toRgba(deepColor, isDarkTheme ? 0.76 : 0.58));
      root.style.setProperty("--theme-table-header", toRgba(selectedTheme.borderColor, isDarkTheme ? 0.14 : 0.1));
      root.style.setProperty("--theme-table-row", selectedTheme.ui.surface);
      root.style.setProperty("--theme-table-row-hover", toRgba(selectedTheme.borderColor, isDarkTheme ? 0.16 : 0.08));

      // Dotted pattern color - use the darkest color with low opacity
      const dotColor = selectedTheme.colors[selectedTheme.colors.length - 1];
      root.style.setProperty("--theme-dot-color", `${dotColor}${isDarkTheme ? "55" : "25"}`);
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

