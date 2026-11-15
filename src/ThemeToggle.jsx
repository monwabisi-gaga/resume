import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'theme';

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className="fixed top-3 right-3 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border text-ink-dim transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent sm:top-6 sm:right-6 sm:h-9 sm:w-9"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" strokeWidth={2} /> : <Sun className="h-4 w-4" strokeWidth={2} />}
    </button>
  );
}
