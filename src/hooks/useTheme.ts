import { useLayoutEffect, useState, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
const DARK_THEME_QUERY = '(prefers-color-scheme: dark)';

function getSystemTheme(): Theme {
  return window.matchMedia(DARK_THEME_QUERY).matches ? 'dark' : 'light';
}

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(DARK_THEME_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export function useTheme() {
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
  );
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? systemTheme;

  useLayoutEffect(() => {
    const root = document.documentElement;
    // Without an override, CSS follows the system before and after React mounts.
    if (override) root.setAttribute('data-theme', override);
    else root.removeAttribute('data-theme');

    return () => root.removeAttribute('data-theme');
  }, [override]);

  const toggleTheme = () => {
    setOverride(theme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
}
