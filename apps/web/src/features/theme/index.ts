/**
 * Theme Feature
 *
 * Exports all theme-related functionality:
 * - Provider for theme context
 * - Components for theme switching
 * - Scripts for inline theme initialization
 */

// Provider
export {
  ThemeProvider,
  useTheme,
  type ThemeChoice,
} from './provider/theme-provider';

// Components
export { ThemeSwitch } from './components/theme-switch';
export { ThemeSwitchConnected } from './components/theme-switch-connect';

// Scripts
export { InlineThemeScript } from './scripts/inline-theme-script';
