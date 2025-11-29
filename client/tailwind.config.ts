import type { Config } from 'tailwindcss'
import { themes } from './src/lib/themes'

// Convert themes array to Tailwind color format
const themeColors = themes.reduce((acc, theme) => {
  acc[theme.name] = {
    color: theme.color,
    textColor: theme.textColor,
    lightColor: theme.lightColor,
    darkColor: theme.darkColor,
    accentColor: theme.accentColor,
  }
  return acc
}, {} as Record<string, Record<string, string>>)

const config: Config = {
  theme: {
    extend: {
      colors: {
        ...themeColors,
        'theme-text': 'var(--color-text)',
        'theme-bg': 'var(--color-bg)',
      },
    },
  },
}

export default config