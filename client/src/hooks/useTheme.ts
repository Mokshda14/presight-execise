import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolvedTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme, pinned: boolean) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = pinned ? theme : 'light dark';
}

// Follows the OS by default. Toggling away from the OS scheme pins the choice
// in localStorage; toggling back to it un-pins so OS changes apply again.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolvedTheme);

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (localStorage.getItem('theme')) return; // pinned, ignore OS changes
      const next = systemTheme();
      applyTheme(next, false);
      setTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = resolvedTheme() === 'dark' ? 'light' : 'dark';
    const pinned = next !== systemTheme();
    if (pinned) {
      localStorage.setItem('theme', next);
    } else {
      localStorage.removeItem('theme');
    }
    applyTheme(next, pinned);
    setTheme(next);
  }, []);

  return { theme, toggle };
}
