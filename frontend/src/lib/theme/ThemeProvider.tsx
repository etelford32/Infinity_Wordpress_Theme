import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme =
  | 'dark-cosmic'
  | 'science-editorial'
  | 'science-light'
  | 'science-dark'
  | 'light-playful';

export interface ThemeConfig {
  id: Theme;
  label: string;
  description: string;
  isDark: boolean;
  icon: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'dark-cosmic',
    label: 'Dark Cosmic',
    description: 'Deep space — indigo & violet',
    isDark: true,
    icon: '🌌',
  },
  {
    id: 'science-editorial',
    label: 'Editorial Light',
    description: 'Research paper — off-white & teal',
    isDark: false,
    icon: '📄',
  },
  {
    id: 'science-dark',
    label: 'Science Dark',
    description: 'Midnight blue — cool & precise',
    isDark: true,
    icon: '🔭',
  },
  {
    id: 'science-light',
    label: 'Science Light',
    description: 'Clean light — blue accents',
    isDark: false,
    icon: '🧪',
  },
  {
    id: 'light-playful',
    label: 'Playful',
    description: 'Warm & creative — pink & orange',
    isDark: false,
    icon: '🎨',
  },
];

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from WordPress data or localStorage
    const wpTheme = (window as any).infinityData?.theme as Theme | undefined;
    const savedTheme = localStorage.getItem('infinity-theme') as Theme | null;
    return wpTheme || savedTheme || 'dark-cosmic';
  });

  const themeConfig = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const isDark = themeConfig.isDark;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('infinity-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);

    // Optionally sync with WordPress user meta
    if ((window as any).infinityData?.isUserLoggedIn) {
      fetch(`${(window as any).infinityData.restUrl}infinity/v1/user/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': (window as any).infinityData.nonce,
        },
        body: JSON.stringify({ theme: newTheme }),
      }).catch(console.error);
    }
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
