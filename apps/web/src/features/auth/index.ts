/**
 * Auth Feature
 *
 * Exports all authentication-related functionality:
 * - Hooks for auth state and mutations
 * - Components for auth UI (modals, panels)
 */

// Hooks (API + auth logic)
export * from './hooks';

// Components
export { AuthModal } from './components/auth-modal';
export { AuthModalDev } from './components/auth-modal-dev';
export { SignInPanel } from './components/sign-in-panel';
export { SignUpPanel } from './components/sign-up-panel';
export { SignOutConfirmModal } from './components/signout-confirm-modal';
