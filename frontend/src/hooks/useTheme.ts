import { useEffect, useState } from 'react';

// Define the possible theme values
type Theme = 'light' | 'dark';

// This is the custom hook that will manage our theme logic
export const useTheme = (): [Theme, (theme: Theme) => void] => {
  // Initialize state. We default to 'dark' and let useEffect correct it on mount.
  const [theme, setThemeState] = useState<Theme>('dark');

  // This function will be returned to allow components to change the theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // This effect runs once on component mount to set the initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set theme based on this priority: 1. Saved in localStorage, 2. OS preference, 3. Default to 'dark'
    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (prefersDark) {
      setThemeState('dark');
    } else {
        setThemeState('light');
    }
  }, []);

  // This effect runs whenever the `theme` state changes
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove the old theme class and add the new one
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);

    // Save the user's preference for future visits
    localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, setTheme];
};