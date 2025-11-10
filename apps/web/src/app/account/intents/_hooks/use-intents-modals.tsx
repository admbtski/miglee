/**
 * Custom hook for managing intents modals state
 */

'use client';

import { useCallback, useState } from 'react';
import type { IntentsResultCoreFragment_IntentsResult_items_Intent as IntentItem } from '@/lib/api/__generated__/react-query-update';

export function useIntentsModals() {
  const [preview, setPreview] = useState<IntentItem | undefined>();
  const [editId, setEditId] = useState<string | null>(null);
  const [leaveId, setLeaveId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);

  // Helper: open preview by id
  const openPreview = useCallback((id: string, flatItems: IntentItem[]) => {
    const found = flatItems.find((item) => item.id === id);
    if (found) setPreview(found);
  }, []);

  const closePreview = useCallback(() => setPreview(undefined), []);
  const closeEdit = useCallback(() => setEditId(null), []);
  const closeLeave = useCallback(() => setLeaveId(null), []);
  const closeCancel = useCallback(() => setCancelId(null), []);
  const closeDelete = useCallback(() => setDeleteId(null), []);
  const closeManage = useCallback(() => setManageId(null), []);

  return {
    // State
    preview,
    editId,
    leaveId,
    cancelId,
    deleteId,
    manageId,
    // Setters
    setPreview,
    setEditId,
    setLeaveId,
    setCancelId,
    setDeleteId,
    setManageId,
    // Helpers
    openPreview,
    closePreview,
    closeEdit,
    closeLeave,
    closeCancel,
    closeDelete,
    closeManage,
  };
}
