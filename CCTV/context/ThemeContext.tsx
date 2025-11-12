import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
    card: string;
    success: string;
    error: string;
    warning: string;
    button: string;
    buttonText: string;
    modalOverlay: string;
  };
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
    accent: '#007AFF',
    border: '#e0e0e0',
    card: '#ffffff',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    button: '#007AFF',
    buttonText: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#cccccc',
    accent: '#007AFF',
    border: '#333333',
    card: '#1e1e1e',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    button: '#007AFF',
    buttonText: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      let savedTheme: string | null = null;
      
      if (Platform.OS === 'web') {
        savedTheme = localStorage.getItem('cctv_theme_mode');
      } else {
        // Import AsyncStorage dynamically for mobile
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        savedTheme = await AsyncStorage.default.getItem('cctv_theme_mode');
      }
      
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('cctv_theme_mode', mode);
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem('cctv_theme_mode', mode);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  const currentTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        isDark: themeMode === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};