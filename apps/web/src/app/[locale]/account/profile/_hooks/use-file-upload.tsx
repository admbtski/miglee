/**
 * Custom hook for file upload/preview management
 * Handles blob URL creation and cleanup for file previews
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing file upload previews with automatic cleanup
 *
 * @returns Object containing:
 * - url: Preview URL (blob URL or null)
 * - handlePick: Function to handle file selection
 * - handleRemove: Function to remove preview and cleanup
 *
 * @example
 * ```tsx
 * const { url, handlePick, handleRemove } = useFileUpload();
 *
 * <input
 *   type="file"
 *   onChange={(e) => handlePick(e.target.files?.[0])}
 * />
 * {url && <img src={url} />}
 * ```
 */
export function useFileUpload() {
  const [url, setUrl] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (url?.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  const handlePick = useCallback((file?: File) => {
    if (!file) return;
    const newUrl = URL.createObjectURL(file);
    setUrl((prevUrl) => {
      if (prevUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrl);
      }
      return newUrl;
    });
  }, []);

  const handleRemove = useCallback(() => {
    setUrl((prevUrl) => {
      if (prevUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });
  }, []);

  return {
    url,
    handlePick,
    handleRemove,
  };
}
