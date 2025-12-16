/**
 * AccountPageWrapper - Standardized layout wrapper for account pages
 *
 * Provides consistent max-width, padding, and spacing across all account pages.
 */

import type { ReactNode } from 'react';

interface AccountPageWrapperProps {
  children: ReactNode;
  /**
   * Max width of the content area
   * - 'default': 1280px (max-w-7xl) - for most pages
   * - 'wide': 1536px (max-w-screen-2xl) - for tables, lists
   * - 'full': 100% - for special layouts like chats
   * - 'narrow': 768px (max-w-3xl) - for forms, settings
   */
  maxWidth?: 'default' | 'wide' | 'full' | 'narrow';
  /**
   * Padding configuration
   */
  padding?: 'default' | 'compact' | 'none';
}

export function AccountPageWrapper({
  children,
  maxWidth = 'default',
  padding = 'default',
}: AccountPageWrapperProps) {
  const maxWidthClass = {
    default: 'max-w-7xl', // 1280px
    wide: 'max-w-screen-2xl', // 1536px
    full: 'max-w-none', // 100%
    narrow: 'max-w-3xl', // 768px
  }[maxWidth];

  const paddingClass = {
    default: 'px-4 py-6 sm:px-6 lg:px-8',
    compact: 'px-4 py-4',
    none: '',
  }[padding];

  return (
    <div
      className={`mx-auto w-full ${maxWidthClass} ${paddingClass} space-y-8`}
    >
      {children}
    </div>
  );
}
