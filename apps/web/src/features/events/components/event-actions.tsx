import type { EventDetailsData } from '@/features/events/types/event-details';
import {
  Share2,
  MessageCircle,
  BellOff,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { EventChatModal } from './event-chat-modal';

type EventActionsProps = {
  event: EventDetailsData;
};

export function EventActions({ event }: EventActionsProps) {
  const [chatOpen, setChatOpen] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Sprawdź to wydarzenie: ${event.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link skopiowany do schowka!');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link skopiowany do schowka!');
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="p-4 border rounded-2xl border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Akcje
        </h3>

        <div className="space-y-1">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors rounded-xl text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Share2 className="w-4 h-4" />
            <span>Udostępnij</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors rounded-xl text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Kopiuj link</span>
          </button>

          {/* Chat (if joined) */}
          <button
            onClick={() => setChatOpen(true)}
            disabled={!event.userMembership?.isJoined}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors rounded-xl text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Otwórz czat</span>
            {event.messagesCount > 0 && (
              <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                {event.messagesCount}
              </span>
            )}
          </button>

          {/* Mute */}
          <button
            disabled
            className="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors rounded-xl text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <BellOff className="w-4 h-4" />
            <span>Wycisz powiadomienia</span>
          </button>
        </div>
      </div>

      {/* Invite Links (Owner/Mod only) */}
      {event.inviteLinks && event.inviteLinks.length > 0 && (
        <div className="p-4 border rounded-2xl border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Linki zaproszeń
          </h3>

          <div className="space-y-2">
            {event.inviteLinks.map((link) => (
              <div
                key={link.code}
                className="p-3 border rounded-xl border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between mb-1">
                  <code className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                    {link.code}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/invite/${link.code}`
                      );
                      alert('Link skopiowany!');
                    }}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Kopiuj
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>
                    {link.usedCount}
                    {link.maxUses ? ` / ${link.maxUses}` : ''} użyć
                  </span>
                  {link.expiresAt && (
                    <span>
                      • Wygasa{' '}
                      {new Date(link.expiresAt).toLocaleDateString('pl-PL')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsorship Info (if highlighted) */}
      {event.sponsorship?.status === 'ACTIVE' &&
        (event.sponsorship.plan === 'PLUS' ||
          event.sponsorship.plan === 'PRO') && (
          <div className="p-4 border border-yellow-200 rounded-2xl bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                Wydarzenie wyróżnione
              </h3>
            </div>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              To wydarzenie jest sponsorowane przez{' '}
              <span className="font-medium">
                {event.sponsorship.sponsor.name}
              </span>
            </p>
          </div>
        )}

      {/* Chat Modal */}
      <EventChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
        membersCount={event.joinedCount}
      />
    </div>
  );
}
