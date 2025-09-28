'use client';

import { useTheme } from './theme-provider';
import { ThemeSwitch } from './theme-switch';

/**
 * Integracja:
 * - checked = resolvedTheme === 'dark' (działa także w trybie system)
 * - click: jeśli był 'system' -> ustaw explicit przeciwny; jeśli explicit -> przełącz explicit
 * - right click: powrót do trybu 'system'
 */
export function ThemeSwitchConnected() {
  const { theme, resolvedTheme, setTheme, toggle } = useTheme();

  const checked = resolvedTheme === 'dark';

  const handleToggle = () => {
    if (theme === 'system') {
      // użytkownik kliknął w switch – wychodzimy z 'system'
      setTheme(checked ? 'light' : 'dark');
    } else {
      // normalne przełączanie explicit light <-> dark
      toggle();
    }
  };

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setTheme('system'); // respektuj OS
  };

  return (
    <div
      className="flex items-center"
      onContextMenu={handleContextMenu}
      title={theme === 'system' ? 'System theme' : `Theme: ${resolvedTheme}`}
    >
      <ThemeSwitch checked={checked} onChange={handleToggle} />
    </div>
  );
}
