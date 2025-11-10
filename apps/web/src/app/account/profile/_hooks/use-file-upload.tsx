/**
 * Custom hook for file upload/preview management
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

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
