/**
 * Chat Details Component - Settings panel for chat
 */

// TODO i18n: All strings need translation keys

'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import {
  Bell,
  BellOff,
  ChevronDown,
  Flag,
  ImageIcon,
  LinkIcon,
  Palette,
  Pencil,
  Pin,
  Shield,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import type { ChatKind } from '@/features/chat/types';
import { Section, Row } from './chat-details-section';
import { ReportChatModal } from './ReportChatModal';
import {
  useGetEventMute,
  useGetDmMute,
  useMuteEvent,
  useMuteDmThread,
} from '@/features/notifications';
import { toast } from 'sonner';

type ChatDetailsProps = {
  onClose: () => void;
  kind: ChatKind;
  /** Event ID for channel type */
  eventId?: string;
  /** Thread ID for DM type */
  threadId?: string;
  /** Chat name/title for report modal */
  chatName?: string;
};

export function ChatDetails({
  onClose,
  kind,
  eventId,
  threadId,
  chatName = '',
}: ChatDetailsProps) {
  const [openCustomize, setOpenCustomize] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Query mute status based on chat type
  const eventMuteQuery = useGetEventMute(
    { eventId: eventId! },
    { enabled: kind === 'channel' && !!eventId }
  );

  const dmMuteQuery = useGetDmMute(
    { threadId: threadId! },
    { enabled: kind === 'dm' && !!threadId }
  );

  // Mutations
  const muteEventMutation = useMuteEvent();
  const muteDmThreadMutation = useMuteDmThread();

  // Derive mute state
  const isMuted =
    kind === 'channel'
      ? (eventMuteQuery.data?.eventMute?.muted ?? false)
      : (dmMuteQuery.data?.dmMute?.muted ?? false);

  const mutedAt =
    kind === 'channel'
      ? eventMuteQuery.data?.eventMute?.createdAt
      : dmMuteQuery.data?.dmMute?.createdAt;

  const isLoading =
    kind === 'channel' ? eventMuteQuery.isLoading : dmMuteQuery.isLoading;

  const isMutating =
    muteEventMutation.isPending || muteDmThreadMutation.isPending;

  // Handle toggle mute
  const handleToggleMute = async () => {
    const newMutedState = !isMuted;

    try {
      if (kind === 'channel' && eventId) {
        await muteEventMutation.mutateAsync({
          eventId,
          muted: newMutedState,
        });
      } else if (kind === 'dm' && threadId) {
        await muteDmThreadMutation.mutateAsync({
          threadId,
          muted: newMutedState,
        });
      }

      // TODO i18n
      toast.success(
        newMutedState ? 'Powiadomienia wyciszone' : 'Powiadomienia włączone'
      );
    } catch (error) {
      // TODO i18n
      toast.error('Nie udało się zmienić ustawień powiadomień');
    }
  };

  // Format muted date
  const formatMutedDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      // TODO i18n: date formatting should be locale-aware
      return format(date, "d MMM yyyy 'o' HH:mm", { locale: pl });
    } catch {
      return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-4 bg-white border-b border-zinc-200 dark:border-zinc-800 dark:bg-[#141518]">
        <div className="text-sm font-semibold">
          {/* TODO i18n */}
          {kind === 'channel' ? 'Szczegóły kanału' : 'Szczegóły rozmowy'}
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* TODO i18n */}
        <Section title="Powiadomienia">
          <Row
            icon={
              isMuted ? (
                <BellOff className="w-4 h-4 text-amber-500" />
              ) : (
                <Bell className="w-4 h-4" />
              )
            }
            label={isMuted ? 'Wyciszone' : 'Wycisz powiadomienia'}
            onClick={handleToggleMute}
            toggle
            isOn={isMuted}
            isLoading={isLoading || isMutating}
            subLabel={
              isMuted && mutedAt
                ? `Wyciszono: ${formatMutedDate(mutedAt)}`
                : undefined
            }
          />
        </Section>

        <div className="mb-6">
          <button
            onClick={() => setOpenCustomize((x) => !x)}
            className="flex items-center justify-between w-full px-1 pb-2 text-xs font-semibold tracking-wide uppercase text-zinc-500"
          >
            {/* TODO i18n */}
            <span>Personalizuj {kind === 'channel' ? 'kanał' : 'czat'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openCustomize ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openCustomize && (
            <div
              id="customize-panel"
              className="divide-y divide-zinc-200 dark:divide-zinc-800"
            >
              <Row
                icon={<Pencil className="w-4 h-4" />}
                label={
                  // TODO i18n
                  kind === 'channel'
                    ? 'Zmień nazwę kanału'
                    : 'Zmień nazwę czatu'
                }
              />
              <Row
                icon={<ImageIcon className="w-4 h-4" />}
                // TODO i18n
                label="Zmień zdjęcie"
              />
              <Row
                icon={<Palette className="w-4 h-4" />}
                // TODO i18n
                label="Zmień motyw"
              />
              <Row
                icon={<ThumbsUp className="w-4 h-4" />}
                // TODO i18n
                label="Zmień emoji"
              />
            </div>
          )}
        </div>

        <Section
          // TODO i18n
          title={kind === 'channel' ? 'Członkowie kanału' : 'Uczestnicy'}
        >
          <Row
            icon={<Users className="w-4 h-4" />}
            // TODO i18n
            label={kind === 'channel' ? 'Zarządzaj członkami' : 'Zobacz profil'}
          />
        </Section>

        {/* TODO i18n */}
        <Section title="Multimedia i linki">
          <Row icon={<ImageIcon className="w-4 h-4" />} label="Multimedia" />
          <Row icon={<LinkIcon className="w-4 h-4" />} label="Linki" />
        </Section>

        {/* TODO i18n */}
        <Section title="Prywatność i wsparcie">
          <Row
            icon={<Shield className="w-4 h-4" />}
            label={
              // TODO i18n
              kind === 'channel' ? 'Prywatność kanału' : 'Prywatność rozmowy'
            }
          />
          {kind === 'channel' && (
            <Row
              icon={<Pin className="w-4 h-4" />}
              // TODO i18n
              label="Zobacz przypięte wiadomości"
            />
          )}
          <Row
            icon={<Flag className="w-4 h-4 text-red-500" />}
            // TODO i18n
            label={kind === 'channel' ? 'Zgłoś kanał' : 'Zgłoś rozmowę'}
            onClick={() => setReportModalOpen(true)}
          />
        </Section>
      </div>

      {/* Report Modal */}
      <ReportChatModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        entityId={(kind === 'channel' ? eventId : threadId) || ''}
        kind={kind}
        chatName={chatName}
      />
    </div>
  );
}
