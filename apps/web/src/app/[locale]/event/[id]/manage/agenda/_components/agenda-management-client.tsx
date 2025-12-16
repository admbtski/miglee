/**
 * Agenda Management Client Component
 * Handles adding, editing, removing, and reordering agenda items (slots)
 */

// TODO i18n: All Polish strings need translation keys
// TODO i18n: Date/time formatting should be locale-aware

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  MoreVertical,
  Edit2,
  ListOrdered,
  Loader2,
  AlertCircle,
  Clock,
  User,
  UserPlus,
  X,
  Search,
  Camera,
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { toast } from 'sonner';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react';
import { cn } from '@/lib/utils';
import {
  useEventAgendaItemsQuery,
  useUpdateEventAgendaMutation,
} from '@/features/events/api/agenda';
import { useEventDetailQuery } from '@/features/events/api/events';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '../../_components/plan-upgrade-banner';
import { useUsersQuery } from '@/features/users/api/users';
import { Modal } from '@/components/feedback/modal';
import { Avatar as AvatarComponent } from '@/components/ui/avatar';
import { buildAvatarUrl } from '@/lib/media/url';
import type { AgendaHostKind } from '@/lib/api/__generated__/react-query-update';

// ----- Types -----

interface AgendaHost {
  id: string;
  kind: 'USER' | 'MANUAL';
  userId?: string;
  userName?: string;
  userAvatarKey?: string;
  userAvatarBlurhash?: string;
  name?: string;
  avatarUrl?: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  hosts: AgendaHost[];
}

interface AgendaManagementClientProps {
  eventId: string;
}

type UserSearchItem = {
  id: string;
  name: string;
  avatarKey?: string | null;
  avatarBlurhash?: string | null;
  email?: string | null;
};

// ----- Helper Components -----

function formatTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Action Menu Component using floating-ui
function AgendaItemActionMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="flex items-center justify-center w-8 h-8 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        aria-label="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 min-w-[160px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black/5 dark:ring-white/5"
            >
              <div className="p-1">
                <button
                  onClick={() => {
                    onEdit();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm transition-colors rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edytuj</span>
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 transition-colors rounded-md dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Usuń</span>
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

// Host Avatar Component (for display)
function HostAvatar({ host }: { host: AgendaHost }) {
  const name = host.kind === 'USER' ? host.userName : host.name;
  const avatarUrl =
    host.kind === 'USER' && host.userAvatarKey
      ? buildAvatarUrl(host.userAvatarKey, 'xs')
      : host.avatarUrl;

  return (
    <div className="flex items-center gap-2">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'Host'}
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <span className="text-sm text-zinc-700 dark:text-zinc-300">
        {name || 'Bez nazwy'}
      </span>
    </div>
  );
}

// User Search Modal for adding USER hosts
function UserSearchModal({
  open,
  onClose,
  onSelect,
  existingUserIds,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (user: UserSearchItem) => void;
  existingUserIds: string[];
}) {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const [debounced, setDebounced] = useState(q);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, isLoading, isFetching } = useUsersQuery(
    {
      limit,
      offset,
      q: debounced.trim().length >= 2 ? debounced.trim() : null,
    },
    { enabled: open }
  );

  const users = data?.users.items ?? [];
  const total = data?.users.pageInfo.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  useEffect(() => {
    if (!open) {
      setQ('');
      setOffset(0);
    }
  }, [open]);

  const Header = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
          <Search className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Wyszukaj prowadzącego</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Wybierz użytkownika z systemu
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const Content = (
    <div className="flex flex-col">
      {/* Search input */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <Search className="h-4 w-4 opacity-60" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
          placeholder="Szukaj po nazwie lub emailu…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
        />
        {(isLoading || isFetching) && (
          <Loader2 className="h-4 w-4 animate-spin opacity-70" />
        )}
      </div>

      {/* Users list */}
      <div className="relative rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="max-h-[50vh] overflow-y-auto">
          {users.length === 0 ? (
            <div className="grid h-full place-items-center p-10 text-sm text-zinc-500">
              {debounced.trim().length < 2
                ? 'Wpisz min. 2 znaki aby wyszukać'
                : 'Nie znaleziono użytkowników'}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {users.map((u) => {
                  const isExisting = existingUserIds.includes(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isExisting) {
                            onSelect(u as UserSearchItem);
                            onClose();
                          }
                        }}
                        disabled={isExisting}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                          isExisting
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                        )}
                      >
                        <AvatarComponent
                          url={buildAvatarUrl(u.avatarKey, 'xs')}
                          blurhash={u.avatarBlurhash}
                          alt={u.name}
                          size={40}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {u.name || '—'}
                          </div>
                          <div className="truncate text-xs text-zinc-500">
                            {u.email ?? '—'}
                          </div>
                        </div>
                        {isExisting && (
                          <span className="text-xs text-zinc-400">
                            Już dodany
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Pagination */}
              {total > limit && (
                <div className="sticky bottom-0 border-t border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="text-xs text-zinc-500">
                      Znaleziono: {total}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          canPrev && setOffset(Math.max(0, offset - limit))
                        }
                        disabled={!canPrev || isLoading || isFetching}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5',
                          'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
                          (!canPrev || isLoading || isFetching) && 'opacity-50'
                        )}
                      >
                        ‹ Wstecz
                      </button>
                      <button
                        type="button"
                        onClick={() => canNext && setOffset(offset + limit)}
                        disabled={!canNext || isLoading || isFetching}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5',
                          'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900',
                          (!canNext || isLoading || isFetching) && 'opacity-50'
                        )}
                      >
                        Dalej ›
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      density="comfortable"
      ariaLabel="Wyszukaj prowadzącego"
      header={Header}
      content={Content}
    />
  );
}

// Helper function to compress and resize image
async function compressImage(
  file: File,
  maxSize: number = 128,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions (maintain aspect ratio, max 128x128)
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (dataUrl.startsWith('data:image/webp')) {
        resolve(dataUrl);
      } else {
        // Browser doesn't support WebP, use JPEG
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Load the image from file
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Manual Host Editor with Avatar Upload
function ManualHostEditor({
  host,
  onUpdate,
  onRemove,
}: {
  host: AgendaHost;
  onUpdate: (updates: Partial<AgendaHost>) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    host.avatarUrl || null
  );
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik graficzny');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Maksymalny rozmiar pliku to 10MB');
      return;
    }

    try {
      setIsCompressing(true);
      // Compress and resize to 128x128, ~5-15KB result
      const compressedDataUrl = await compressImage(file, 128, 0.7);
      setPreviewUrl(compressedDataUrl);
      onUpdate({ avatarUrl: compressedDataUrl });
    } catch (error) {
      toast.error('Nie udało się przetworzyć obrazu');
      console.error('Image compression error:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onUpdate({ avatarUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {isCompressing ? (
            <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center border-2 border-white dark:border-zinc-700 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={host.name || 'Avatar'}
              className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-zinc-700 shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border-2 border-white dark:border-zinc-700 shadow-sm">
              <User className="w-6 h-6" />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            title="Zmień zdjęcie"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
        {previewUrl && !isCompressing && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Usuń
          </button>
        )}
      </div>

      {/* Name input */}
      <div className="flex-1">
        <label className="block mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Imię i nazwisko
        </label>
        <input
          type="text"
          value={host.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="np. Jan Kowalski"
          maxLength={120}
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-zinc-400">Host spoza systemu Miglee</p>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        aria-label="Usuń hosta"
        title="Usuń"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// User Host Display (for hosts selected from system)
function UserHostDisplay({
  host,
  onRemove,
}: {
  host: AgendaHost;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
      <AvatarComponent
        url={buildAvatarUrl(host.userAvatarKey, 'sm')}
        blurhash={host.userAvatarBlurhash}
        alt={host.userName || 'User'}
        size={40}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {host.userName || 'Nieznany użytkownik'}
        </div>
        <div className="text-xs text-indigo-600 dark:text-indigo-400">
          Użytkownik Miglee
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        aria-label="Usuń hosta"
        title="Usuń"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ----- Main Component -----

export function AgendaManagementClient({
  eventId,
}: AgendaManagementClientProps) {
  // Fetch event for plan check
  const { data: eventData, isLoading: eventLoading } = useEventDetailQuery({
    id: eventId,
  });

  const {
    data: serverItems,
    isLoading: agendaLoading,
    error,
    refetch,
  } = useEventAgendaItemsQuery({
    eventId,
  });
  const updateAgendaMutation = useUpdateEventAgendaMutation();

  // Check sponsorship plan
  const sponsorshipPlan = eventData?.event?.sponsorshipPlan as SponsorshipPlan;
  const isLoading = eventLoading || agendaLoading;

  // Local state
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // User search modal state
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchItemId, setUserSearchItemId] = useState<string | null>(null);

  // Sync with server data on load
  useEffect(() => {
    if (
      serverItems &&
      serverItems.length > 0 &&
      items.length === 0 &&
      !hasChanges
    ) {
      setItems(
        serverItems.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          startAt: item.startAt || undefined,
          endAt: item.endAt || undefined,
          hosts: (item.hosts || []).map((h: any) => ({
            id: h.id,
            kind: h.kind,
            userId: h.userId || undefined,
            userName: h.user?.name || undefined,
            userAvatarKey: h.user?.avatarKey || undefined,
            userAvatarBlurhash: h.user?.avatarBlurhash || undefined,
            name: h.name || undefined,
            avatarUrl: h.avatarUrl || undefined,
          })),
        }))
      );
    }
  }, [serverItems, items.length, hasChanges]);

  // Get existing user IDs for the current item being edited
  const existingUserIds = useMemo(() => {
    if (!userSearchItemId) return [];
    const item = items.find((i) => i.id === userSearchItemId);
    if (!item) return [];
    return item.hosts
      .filter((h) => h.kind === 'USER' && h.userId)
      .map((h) => h.userId!);
  }, [items, userSearchItemId]);

  // Handlers
  const handleAddItem = useCallback(() => {
    const newItem: AgendaItem = {
      id: `temp-${Date.now()}`,
      title: '',
      hosts: [],
    };
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
    setHasChanges(true);
  }, []);

  const handleRemoveItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
      setHasChanges(true);
    },
    [editingId]
  );

  const handleUpdateItem = useCallback(
    (id: string, updates: Partial<AgendaItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      setHasChanges(true);
    },
    []
  );

  const handleReorder = useCallback((newOrder: AgendaItem[]) => {
    setItems(newOrder);
    setHasChanges(true);
  }, []);

  const handleAddManualHost = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newHost: AgendaHost = {
          id: `temp-host-${Date.now()}`,
          kind: 'MANUAL',
          name: '',
        };
        return { ...item, hosts: [...item.hosts, newHost] };
      })
    );
    setHasChanges(true);
  }, []);

  const handleAddUserHost = useCallback(
    (itemId: string, user: UserSearchItem) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          // Check if user is already added
          if (
            item.hosts.some((h) => h.kind === 'USER' && h.userId === user.id)
          ) {
            return item;
          }
          const newHost: AgendaHost = {
            id: `temp-host-${Date.now()}`,
            kind: 'USER',
            userId: user.id,
            userName: user.name,
            userAvatarKey: user.avatarKey || undefined,
            userAvatarBlurhash: user.avatarBlurhash || undefined,
          };
          return { ...item, hosts: [...item.hosts, newHost] };
        })
      );
      setHasChanges(true);
    },
    []
  );

  const handleUpdateHost = useCallback(
    (itemId: string, hostId: string, updates: Partial<AgendaHost>) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            hosts: item.hosts.map((h) =>
              h.id === hostId ? { ...h, ...updates } : h
            ),
          };
        })
      );
      setHasChanges(true);
    },
    []
  );

  const handleRemoveHost = useCallback((itemId: string, hostId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          hosts: item.hosts.filter((h) => h.id !== hostId),
        };
      })
    );
    setHasChanges(true);
  }, []);

  const openUserSearch = useCallback((itemId: string) => {
    setUserSearchItemId(itemId);
    setUserSearchOpen(true);
  }, []);

  const handleSave = async () => {
    // Validate
    for (const item of items) {
      if (!item.title.trim()) {
        toast.error('Wszystkie sloty muszą mieć tytuł');
        return;
      }
      if (item.title.length < 3) {
        toast.error('Tytuł musi mieć minimum 3 znaki');
        return;
      }
      if (item.title.length > 120) {
        toast.error('Tytuł nie może przekraczać 120 znaków');
        return;
      }
      if (item.description && item.description.length > 1000) {
        toast.error('Opis nie może przekraczać 1000 znaków');
        return;
      }

      // Validate times
      if ((item.startAt && !item.endAt) || (!item.startAt && item.endAt)) {
        toast.error('Jeśli podajesz czas, podaj zarówno początek jak i koniec');
        return;
      }
      if (item.startAt && item.endAt) {
        const start = new Date(item.startAt);
        const end = new Date(item.endAt);
        if (end <= start) {
          toast.error(
            'Czas zakończenia musi być późniejszy niż czas rozpoczęcia'
          );
          return;
        }
      }

      // Validate hosts
      for (const host of item.hosts) {
        if (host.kind === 'MANUAL' && !host.name?.trim()) {
          toast.error('Ręczni hosty muszą mieć imię i nazwisko');
          return;
        }
        if (host.name && host.name.length > 120) {
          toast.error('Nazwa hosta nie może przekraczać 120 znaków');
          return;
        }
      }

      if (item.hosts.length > 10) {
        toast.error('Maksymalnie 10 hostów na slot');
        return;
      }
    }

    if (items.length > 50) {
      toast.error('Maksymalnie 50 slotów w agendzie');
      return;
    }

    try {
      await updateAgendaMutation.mutateAsync({
        input: {
          eventId,
          items: items.map((item) => ({
            title: item.title.trim(),
            description: item.description?.trim() || undefined,
            startAt: item.startAt || undefined,
            endAt: item.endAt || undefined,
            hosts: item.hosts.map((h) => ({
              kind: h.kind as AgendaHostKind,
              userId: h.kind === 'USER' ? h.userId : undefined,
              name: h.kind === 'MANUAL' ? h.name?.trim() : undefined,
              avatarUrl:
                h.kind === 'MANUAL'
                  ? h.avatarUrl?.trim() || undefined
                  : undefined,
            })),
          })),
        },
      });
      toast.success('Agenda została zapisana');
      setHasChanges(false);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Nie udało się zapisać agendy');
    }
  };

  // ----- Render -----

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-100">
              Błąd ładowania
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              Nie udało się załadować agendy. Spróbuj ponownie.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PlanUpgradeBanner
      currentPlan={sponsorshipPlan}
      requiredPlan="PLUS"
      featureName="Agenda dostępna w planach Plus i Pro"
      featureDescription="Stwórz szczegółowy program wydarzenia z podziałem na sloty czasowe. Dodaj prowadzących i opisy, aby uczestnicy wiedzieli, czego się spodziewać."
      eventId={eventId}
    >
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <ListOrdered className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Program wydarzenia
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Dodaj sloty programu z tytułem, opisem i prowadzącymi
              </p>
            </div>
          </div>
          <button
            onClick={handleAddItem}
            disabled={items.length >= 50}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Dodaj slot
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            <strong>Wskazówka:</strong> Przeciągnij sloty aby zmienić kolejność.
            Możesz dodać prowadzących z systemu Miglee lub ręcznie (np. gości
            zewnętrznych).
          </p>
        </div>

        {/* Items List (Reorderable) */}
        {items.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-xl border-zinc-300 dark:border-zinc-700">
            <ListOrdered className="w-12 h-12 mx-auto mb-4 text-zinc-400 dark:text-zinc-600" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Brak slotów w agendzie
            </h3>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Dodaj pierwszy slot, aby rozpocząć tworzenie programu wydarzenia
            </p>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Dodaj pierwszy slot
            </button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={handleReorder}
            className="space-y-4"
          >
            {items.map((item, index) => {
              const isEditing = editingId === item.id;

              return (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className={cn(
                    'border rounded-xl overflow-hidden',
                    isEditing
                      ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                  )}
                  drag={!isEditing}
                  dragListener={!isEditing}
                  dragControls={undefined}
                  dragElastic={0.05}
                  dragMomentum={false}
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  whileDrag={{
                    scale: 1.02,
                    boxShadow:
                      '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    cursor: 'grabbing',
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  style={{
                    position: 'relative',
                    zIndex: isEditing ? 1 : 'auto',
                  }}
                >
                  {/* Item Header */}
                  <div className="flex items-start gap-4 p-4">
                    {/* Drag Handle */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 mt-1 transition rounded',
                        isEditing
                          ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                          : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing'
                      )}
                      style={{ touchAction: 'none' }}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-4">
                          {/* Title */}
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Tytuł slotu{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  title: e.target.value,
                                })
                              }
                              placeholder="np. Otwarcie konferencji"
                              maxLength={120}
                              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              autoFocus
                            />
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {item.title.length}/120 znaków
                            </p>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Opis (opcjonalnie)
                            </label>
                            <textarea
                              value={item.description || ''}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Dodatkowe informacje o tym slocie..."
                              rows={3}
                              maxLength={1000}
                              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {(item.description || '').length}/1000 znaków
                            </p>
                          </div>

                          {/* Time Fields */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Rozpoczęcie
                              </label>
                              <input
                                type="datetime-local"
                                value={
                                  item.startAt ? item.startAt.slice(0, 16) : ''
                                }
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    startAt: e.target.value
                                      ? new Date(e.target.value).toISOString()
                                      : undefined,
                                  })
                                }
                                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Zakończenie
                              </label>
                              <input
                                type="datetime-local"
                                value={
                                  item.endAt ? item.endAt.slice(0, 16) : ''
                                }
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    endAt: e.target.value
                                      ? new Date(e.target.value).toISOString()
                                      : undefined,
                                  })
                                }
                                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          {/* Hosts Section */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Prowadzący ({item.hosts.length}/10)
                              </label>
                              {item.hosts.length < 10 && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openUserSearch(item.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                                  >
                                    <Search className="w-3 h-3" />
                                    Wyszukaj
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddManualHost(item.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    Ręcznie
                                  </button>
                                </div>
                              )}
                            </div>

                            {item.hosts.length === 0 ? (
                              <div className="p-4 text-center border-2 border-dashed rounded-lg border-zinc-200 dark:border-zinc-700">
                                <User className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                  Brak prowadzących
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                  Wyszukaj użytkownika lub dodaj ręcznie
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {item.hosts.map((host) =>
                                  host.kind === 'USER' ? (
                                    <UserHostDisplay
                                      key={host.id}
                                      host={host}
                                      onRemove={() =>
                                        handleRemoveHost(item.id, host.id)
                                      }
                                    />
                                  ) : (
                                    <ManualHostEditor
                                      key={host.id}
                                      host={host}
                                      onUpdate={(updates) =>
                                        handleUpdateHost(
                                          item.id,
                                          host.id,
                                          updates
                                        )
                                      }
                                      onRemove={() =>
                                        handleRemoveHost(item.id, host.id)
                                      }
                                    />
                                  )
                                )}
                              </div>
                            )}
                          </div>

                          {/* Done editing button */}
                          <div className="pt-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 transition bg-indigo-100 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                            >
                              Zakończ edycję
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Read-only view */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                  Slot {index + 1}
                                </span>
                                {item.startAt && (
                                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(item.startAt)} -{' '}
                                    {formatTime(item.endAt)}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.title || (
                                  <span className="text-zinc-400 italic">
                                    Brak tytułu
                                  </span>
                                )}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Hosts preview */}
                          {item.hosts.length > 0 && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Prowadzący:
                              </span>
                              {item.hosts.slice(0, 3).map((host) => (
                                <HostAvatar key={host.id} host={host} />
                              ))}
                              {item.hosts.length > 3 && (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  +{item.hosts.length - 3} więcej
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action Menu */}
                    {!isEditing && (
                      <div className="mt-1">
                        <AgendaItemActionMenu
                          onEdit={() => setEditingId(item.id)}
                          onDelete={() => handleRemoveItem(item.id)}
                        />
                      </div>
                    )}
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}

        {/* Save Button (Sticky Bottom) */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-6 z-10"
          >
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateAgendaMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateAgendaMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Zapisz agendę
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* User Search Modal */}
        <UserSearchModal
          open={userSearchOpen}
          onClose={() => {
            setUserSearchOpen(false);
            setUserSearchItemId(null);
          }}
          onSelect={(user) => {
            if (userSearchItemId) {
              handleAddUserHost(userSearchItemId, user);
            }
          }}
          existingUserIds={existingUserIds}
        />
      </div>
    </PlanUpgradeBanner>
  );
}
