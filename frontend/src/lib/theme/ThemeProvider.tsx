import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark-cosmic' | 'light-playful' | 'science-light' | 'science-dark';

interface ThemeContextType {
  theme: Theme;
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
    const wpTheme = window.infinityData?.theme as Theme | undefined;
    const savedTheme = localStorage.getItem('infinity-theme') as Theme | null;
    return wpTheme || savedTheme || 'dark-cosmic';
  });

  const isDark = theme === 'dark-cosmic' || theme === 'science-dark';

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('infinity-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);

    // Optionally sync with WordPress user meta
    if (window.infinityData?.isUserLoggedIn) {
      fetch(`${window.infinityData.restUrl}infinity/v1/user/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.infinityData.nonce,
        },
        body: JSON.stringify({ theme: newTheme }),
      }).catch(console.error);
    }
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
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
