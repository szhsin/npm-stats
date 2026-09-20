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
  const [override, setOverride] = useState<Theme | null>(() => {
    // Reuse the choice applied by index.html before the first paint.
    const savedTheme = document.documentElement.getAttribute('data-theme');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  });
  const theme = override ?? systemTheme;

  useLayoutEffect(() => {
    const root = document.documentElement;
    // Without an override, CSS follows the system before and after React mounts.
    if (override) root.setAttribute('data-theme', override);
    else root.removeAttribute('data-theme');

    return () => root.removeAttribute('data-theme');
  }, [override]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setOverride(nextTheme);
    try {
      // Keep this key in sync with the startup script in index.html.
      localStorage.setItem('npm-stats-theme', nextTheme);
    } catch {
      // The toggle still works for this page when storage is unavailable.
    }
  };

  return { theme, toggleTheme };
}
