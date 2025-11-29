'use client';

import { useTheme } from '@/context/ThemeContext';

export default function HomePage() {
  const { selectedTheme } = useTheme();

  return (
    <main>
      <h1 className="text-2xl font-semibold" style={{ color: selectedTheme.textColor }}>
        Home
      </h1>
      <p className="mt-2" style={{ color: selectedTheme.textColor }}>
        Welcome to your dashboard.
      </p>
    </main>
  );
}
