'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { themes, type Theme } from '@/lib/themes';

const ThemeSelector: React.FC = () => {
  const { selectedTheme, setSelectedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const buttonGradient = `linear-gradient(135deg, ${selectedTheme.colors
    .map((c) => (c.startsWith('#') && c.length === 7 ? `${c}55` : c))
    .join(', ')})`;

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handler for selecting a new theme
  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Button to trigger the dropdown */}
      <button
        type="button"
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300/70 shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
        style={{
          backgroundImage: buttonGradient,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          backgroundBlendMode: "overlay",
        }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
        aria-label="Select theme"
      >
        <Image
          src={selectedTheme.iconSrc}
          alt={selectedTheme.name}
          width={20}
          height={20}
          className="w-7 h-7 object-contain"
        />
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div
          id="theme-menu"
          className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeIn"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="theme-button"
          tabIndex={-1}
        >
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
              Energy Themes
            </div>
            <div className="grid grid-cols-5 gap-2" role="none">
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  className="theme-item flex items-center justify-center p-0 rounded-full hover:scale-110 transition-transform"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => handleThemeSelect(theme)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                  title={theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
                >
                  <Image
                    src={theme.iconSrc}
                    alt={theme.name}
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;

