'use client';

import { useCallback, useState } from 'react';

export function useIntentsModals() {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const closeCancel = useCallback(() => setCancelId(null), []);
  const closeDelete = useCallback(() => setDeleteId(null), []);

  return {
    // State
    cancelId,
    deleteId,
    setCancelId,
    setDeleteId,
    closeCancel,
    closeDelete,
  };
}
