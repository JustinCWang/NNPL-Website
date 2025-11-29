'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { themes, type Theme } from '@/lib/themes';

const ThemeSelector: React.FC = () => {
  const { selectedTheme, setSelectedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to update the page body style when the theme changes
  useEffect(() => {
    document.body.style.backgroundColor = selectedTheme.color;
    document.body.style.color = selectedTheme.textColor;
    // Add transitions to the body
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [selectedTheme]);

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
        className="inline-flex w-full justify-center items-center gap-x-1 rounded-lg px-2 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300"
        style={{
          backgroundColor: selectedTheme.color,
          color: selectedTheme.textColor,
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        {/* Using next/image component */}
        <Image
          src={selectedTheme.iconSrc}
          alt={selectedTheme.name}
          width={20} // Required for next/image
          height={20} // Required for next/image
          className="w-5 h-5" // Kept for Tailwind styling
        />
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div
          id="theme-menu"
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="theme-button"
          tabIndex={-1}
        >
          <div className="p-2 grid grid-cols-5 gap-1" role="none">
            {themes.map((theme) => (
              <button
                key={theme.name}
                className="theme-item flex items-center justify-center p-1 rounded hover:bg-gray-100"
                role="menuitem"
                tabIndex={-1}
                onClick={() => handleThemeSelect(theme)}
                style={{
                  backgroundColor: 'white',
                }}
              >
                <div
                  className="p-0.5 rounded-full"
                  style={{
                    backgroundColor: theme.color,
                  }}
                >
                  <Image
                    src={theme.iconSrc}
                    alt={theme.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full bg-white"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;