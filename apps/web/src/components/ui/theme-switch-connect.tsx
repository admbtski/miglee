'use client';

import { useTheme } from '@/providers/theme/theme-provider';
import { ThemeSwitch } from './theme-switch';

export function ThemeSwitchConnected() {
  const { theme, resolvedTheme, setTheme, toggle } = useTheme();

  const checked = resolvedTheme === 'dark';

  const handleToggle = () => {
    if (theme === 'system') {
      setTheme(checked ? 'light' : 'dark');
    } else {
      toggle();
    }
  };

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setTheme('system');
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
