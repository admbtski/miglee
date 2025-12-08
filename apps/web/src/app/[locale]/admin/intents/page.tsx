'use client';

import { useState, useEffect } from 'react';
import { useIntentsQuery } from '@/features/intents/api/intents';
import {
  useAdminCancelIntentMutation,
  useAdminDeleteIntentMutation,
  useAdminRestoreIntentMutation,
} from '@/features/admin/api/admin-intents';
import {
  Visibility,
  IntentStatus,
  MeetingKind,
  IntentsSortBy,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  Eye,
  Search,
  MoreVertical,
  Ban,
  Trash2,
  RotateCcw,
  EyeOff,
  Lock,
  CheckSquare,
} from 'lucide-react';
import { IntentDetailModal } from './_components/intent-detail-modal';
import { BulkActionsModal } from './_components/bulk-actions-modal';
import { NoticeModal } from '@/components/feedback/notice-modal';

export default function IntentsPage() {
  const [keywords, setKeywords] = useState('');
  const [visibility, setVisibility] = useState<Visibility | undefined>();
  const [status, setStatus] = useState<IntentStatus | undefined>();
  const [kind, setKind] = useState<MeetingKind | undefined>();
  const [sortBy, setSortBy] = useState<IntentsSortBy>(IntentsSortBy.CreatedAt);
  const [sortDir, setSortDir] = useState<SortDir>(SortDir.Desc);

  // Selected intents for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [actionIntentId, setActionIntentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, refetch } = useIntentsQuery({
    keywords: keywords ? [keywords] : undefined,
    visibility,
    status,
    kinds: kind ? [kind] : undefined,
    sortBy,
    sortDir,
    limit: 100,
  });

  const cancelMutation = useAdminCancelIntentMutation();
  const deleteMutation = useAdminDeleteIntentMutation();
  const restoreMutation = useAdminRestoreIntentMutation();

  const intents = data?.intents?.items ?? [];
  const total = data?.intents?.pageInfo?.total ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const handleSelectAll = () => {
    if (selectedIds.length === intents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(intents.map((i) => i.id));
    }
  };

  const handleSelectIntent = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCancelIntent = async () => {
    if (!actionIntentId) return;
    try {
      await cancelMutation.mutateAsync({
        id: actionIntentId,
        reason: cancelReason || undefined,
      });
      setCancelModalOpen(false);
      setCancelReason('');
      setActionIntentId(null);
      refetch();
    } catch (error) {
      console.error('Failed to cancel intent:', error);
    }
  };

  const handleDeleteIntent = async () => {
    if (!actionIntentId) return;
    try {
      await deleteMutation.mutateAsync({
        id: actionIntentId,
      });
      setDeleteModalOpen(false);
      setActionIntentId(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete intent:', error);
    }
  };

  const handleRestoreIntent = async () => {
    if (!actionIntentId) return;
    try {
      await restoreMutation.mutateAsync({
        id: actionIntentId,
      });
      setRestoreModalOpen(false);
      setActionIntentId(null);
      refetch();
    } catch (error) {
      console.error('Failed to restore intent:', error);
    }
  };

  const openCancelModal = (id: string) => {
    setActionIntentId(id);
    setCancelModalOpen(true);
    setOpenDropdownId(null);
  };

  const openDeleteModal = (id: string) => {
    setActionIntentId(id);
    setDeleteModalOpen(true);
    setOpenDropdownId(null);
  };

  const openRestoreModal = (id: string) => {
    setActionIntentId(id);
    setRestoreModalOpen(true);
    setOpenDropdownId(null);
  };

  const openDetailModal = (id: string) => {
    setSelectedIntentId(id);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Wydarzenia
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Zarządzanie wydarzeniami platformy
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={() => setBulkModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <CheckSquare className="h-4 w-4" />
            Akcje masowe ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-4 md:grid-cols-5">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Wyszukaj
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Szukaj po tytule..."
                className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Widoczność
            </label>
            <select
              value={visibility || ''}
              onChange={(e) =>
                setVisibility((e.target.value as Visibility) || undefined)
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Wszystkie</option>
              <option value={Visibility.Public}>Publiczne</option>
              <option value={Visibility.Hidden}>Ukryte</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </label>
            <select
              value={status || ''}
              onChange={(e) =>
                setStatus((e.target.value as IntentStatus) || undefined)
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Wszystkie</option>
              <option value={IntentStatus.Upcoming}>Nadchodzące</option>
              <option value={IntentStatus.Ongoing}>W trakcie</option>
              <option value={IntentStatus.Past}>Zakończone</option>
              <option value={IntentStatus.Canceled}>Anulowane</option>
            </select>
          </div>

          {/* Kind */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Typ
            </label>
            <select
              value={kind || ''}
              onChange={(e) =>
                setKind((e.target.value as MeetingKind) || undefined)
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Wszystkie</option>
              <option value={MeetingKind.Onsite}>Stacjonarne</option>
              <option value={MeetingKind.Online}>Online</option>
              <option value={MeetingKind.Hybrid}>Hybrydowe</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sortuj według
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as IntentsSortBy)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value={IntentsSortBy.StartAt}>Data rozpoczęcia</option>
              <option value={IntentsSortBy.CreatedAt}>Data utworzenia</option>
              <option value={IntentsSortBy.UpdatedAt}>Data aktualizacji</option>
              <option value={IntentsSortBy.MembersCount}>
                Liczba członków
              </option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Kierunek
            </label>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value={SortDir.Asc}>Rosnąco</option>
              <option value={SortDir.Desc}>Malejąco</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Znaleziono: <span className="font-semibold">{total}</span> wydarzeń
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && intents.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Brak wydarzeń
            </p>
          </div>
        )}

        {!isLoading && intents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === intents.length &&
                        intents.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Tytuł
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Organizator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Członkowie
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {intents.map((intent) => (
                  <tr
                    key={intent.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(intent.id)}
                        onChange={() => handleSelectIntent(intent.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="max-w-xs px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailModal(intent.id)}
                          className="truncate text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {intent.title}
                        </button>
                        {intent.visibility === Visibility.Hidden && (
                          <EyeOff className="h-4 w-4 text-zinc-400" />
                        )}
                        {intent.joinManuallyClosed && (
                          <Lock className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {intent.owner?.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {format(new Date(intent.startAt), 'dd MMM yyyy', {
                        locale: pl,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {intent.meetingKind || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          intent.status === IntentStatus.Upcoming
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : intent.status === IntentStatus.Ongoing
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : intent.status === IntentStatus.Past
                                ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {intent.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {intent.joinedCount || 0}
                      {intent.min &&
                        intent.max &&
                        ` / ${intent.min}-${intent.max}`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/intent/${intent.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <div className="dropdown-container relative">
                          <button
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === intent.id ? null : intent.id
                              )
                            }
                            className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdownId === intent.id && (
                            <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800">
                              {!intent.canceledAt && !intent.deletedAt && (
                                <button
                                  onClick={() => openCancelModal(intent.id)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                >
                                  <Ban className="h-4 w-4" />
                                  Anuluj
                                </button>
                              )}
                              {!intent.deletedAt && (
                                <button
                                  onClick={() => openDeleteModal(intent.id)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Usuń
                                </button>
                              )}
                              {(intent.canceledAt || intent.deletedAt) && (
                                <button
                                  onClick={() => openRestoreModal(intent.id)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-zinc-100 dark:text-green-400 dark:hover:bg-zinc-700"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Przywróć
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedIntentId && (
        <IntentDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedIntentId(null);
            refetch();
          }}
          intentId={selectedIntentId}
        />
      )}

      <BulkActionsModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={() => {
          setBulkModalOpen(false);
          setSelectedIds([]);
          refetch();
        }}
      />

      <NoticeModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        variant="warning"
        size="md"
        title="Anuluj wydarzenie"
        subtitle="Czy na pewno chcesz anulować to wydarzenie?"
        primaryLabel={
          cancelMutation.isPending ? 'Anulowanie...' : 'Anuluj wydarzenie'
        }
        secondaryLabel="Zamknij"
        onPrimary={handleCancelIntent}
        onSecondary={() => setCancelModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Powód anulowania (opcjonalnie)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Wpisz powód anulowania..."
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </NoticeModal>

      <NoticeModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        variant="error"
        size="sm"
        title="Usuń wydarzenie"
        subtitle="Ta akcja jest nieodwracalna. Wydarzenie zostanie ukryte."
        primaryLabel={deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
        secondaryLabel="Anuluj"
        onPrimary={handleDeleteIntent}
        onSecondary={() => setDeleteModalOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        variant="success"
        size="sm"
        title="Przywróć wydarzenie"
        subtitle="Wydarzenie zostanie przywrócone do stanu aktywnego."
        primaryLabel={
          restoreMutation.isPending ? 'Przywracanie...' : 'Przywróć'
        }
        secondaryLabel="Anuluj"
        onPrimary={handleRestoreIntent}
        onSecondary={() => setRestoreModalOpen(false)}
      >
        <></>
      </NoticeModal>
    </div>
  );
}
