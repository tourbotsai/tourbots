import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useTheme(): ThemeContextType {
  const { user, updateVenue } = useUser();
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise theme from venue preference
  useEffect(() => {
    if (user?.venue?.theme_preference) {
      setThemeState(user.venue.theme_preference);
      // Apply theme to document
      applyTheme(user.venue.theme_preference);
    } else {
      // Default to light theme if no preference set
      setThemeState('light');
      applyTheme('light');
    }
  }, [user?.venue?.theme_preference]);

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    }
  }, []);

  // Set theme and update database
  const setTheme = useCallback(async (newTheme: Theme) => {
    if (!user?.venue) {
      setError('No venue found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update database
      await updateVenue({
        theme_preference: newTheme
      });

      // Update local state
      setThemeState(newTheme);
      
      // Apply theme to document
      applyTheme(newTheme);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update theme');
      console.error('Error updating theme:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue, updateVenue, applyTheme]);

  return {
    theme,
    setTheme,
    isLoading,
    error
  };
} 