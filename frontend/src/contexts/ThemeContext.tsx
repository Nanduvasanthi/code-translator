import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type EditorTheme = 'vs-dark' | 'vs-light' | 'monokai';

interface ThemeContextType {
  theme: Theme;
  fontSize: FontSize;
  editorTheme: EditorTheme;
  toggleTheme: () => void;
  updateAppearance: (settings: { theme?: Theme; fontSize?: FontSize; editorTheme?: EditorTheme }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load all settings from localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    const savedAppearance = JSON.parse(localStorage.getItem('appearanceSettings') || '{}');
    return savedAppearance.theme || 'system';
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const savedAppearance = JSON.parse(localStorage.getItem('appearanceSettings') || '{}');
    return savedAppearance.fontSize || 'medium';
  });

  const [editorTheme, setEditorTheme] = useState<EditorTheme>(() => {
    const savedAppearance = JSON.parse(localStorage.getItem('appearanceSettings') || '{}');
    return savedAppearance.editorTheme || 'vs-dark';
  });

  // Apply theme globally
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark/light theme
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Apply font size globally
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing font size classes
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    
    // Add new font size class
    switch (fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default: // medium
        root.classList.add('text-base');
        break;
    }
  }, [fontSize]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    updateAppearance({ theme: newTheme });
  };

  const updateAppearance = (newSettings: { theme?: Theme; fontSize?: FontSize; editorTheme?: EditorTheme }) => {
    if (newSettings.theme !== undefined) {
      setTheme(newSettings.theme);
    }
    if (newSettings.fontSize !== undefined) {
      setFontSize(newSettings.fontSize);
    }
    if (newSettings.editorTheme !== undefined) {
      setEditorTheme(newSettings.editorTheme);
    }

    // Save to localStorage
    const currentAppearance = JSON.parse(localStorage.getItem('appearanceSettings') || '{}');
    const updatedAppearance = { ...currentAppearance, ...newSettings };
    localStorage.setItem('appearanceSettings', JSON.stringify(updatedAppearance));
  };

  return (
    <ThemeContext.Provider value={{ theme, fontSize, editorTheme, toggleTheme, updateAppearance }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};