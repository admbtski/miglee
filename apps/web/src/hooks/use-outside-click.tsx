/**
 * Custom hook for detecting clicks outside an element
 *
 * @description
 * Detects when user clicks outside a specific element or presses Escape key.
 * Commonly used for closing modals, dropdowns, popovers, and other overlay components.
 *
 * Features:
 * - Detects clicks outside element
 * - Detects Escape key press
 * - Automatic event listener cleanup
 * - Generic type support
 *
 * @example
 * ```tsx
 * const DropdownMenu = ({ onClose }) => {
 *   const ref = useOutsideClose<HTMLDivElement>(onClose);
 *
 *   return (
 *     <div ref={ref} className="dropdown-menu">
 *       <MenuItem>Option 1</MenuItem>
 *       <MenuItem>Option 2</MenuItem>
 *     </div>
 *   );
 * };
 *
 * // With custom element type
 * const Modal = ({ onClose }) => {
 *   const modalRef = useOutsideClose<HTMLDialogElement>(onClose);
 *
 *   return (
 *     <dialog ref={modalRef}>
 *       <h2>Modal Title</h2>
 *       <p>Modal content</p>
 *     </dialog>
 *   );
 * };
 * ```
 */

'use client';

import * as React from 'react';

// =============================================================================
// Hook
// =============================================================================

/**
 * Detect clicks outside element and Escape key press
 *
 * @param onClose - Callback to execute when clicking outside or pressing Escape
 * @returns Ref to attach to the element
 */
export function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);
  return ref;
}
