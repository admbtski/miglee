import { ReactNode } from 'react';

type AccountPageWrapperProps = {
  children: ReactNode;
  /**
   * Max width of the content area
   * - 'default': 1280px (max-w-7xl) - for most pages
   * - 'wide': 1536px (max-w-screen-2xl) - for tables, lists
   * - 'full': 100% - for special layouts like chats
   */
  maxWidth?: 'default' | 'wide' | 'full';
};

/**
 * AccountPageWrapper - Standardized wrapper for all account pages
 *
 * Provides:
 * - Consistent max-width
 * - Consistent padding
 * - Consistent spacing
 *
 * Usage:
 * ```tsx
 * <AccountPageWrapper>
 *   <AccountPageHeader title="..." />
 *   <div>Content</div>
 * </AccountPageWrapper>
 * ```
 */
export function AccountPageWrapper({
  children,
  maxWidth = 'default',
}: AccountPageWrapperProps) {
  const maxWidthClass = {
    default: 'max-w-7xl', // 1280px
    wide: 'max-w-screen-2xl', // 1536px
    full: 'max-w-none', // 100%
  }[maxWidth];

  return (
    <div className={`mx-auto w-full ${maxWidthClass} space-y-8`}>
      {children}
    </div>
  );
}
