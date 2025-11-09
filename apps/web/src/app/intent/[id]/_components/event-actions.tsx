import type { EventDetailsData } from '@/types/event-details';
import {
  Share2,
  MessageCircle,
  Flag,
  BellOff,
  Link as LinkIcon,
} from 'lucide-react';

type EventActionsProps = {
  event: EventDetailsData;
};

export function EventActions({ event }: EventActionsProps) {
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Akcje
        </h3>

        <div className="space-y-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Share2 className="h-5 w-5" />
            <span>Udostępnij</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <LinkIcon className="h-5 w-5" />
            <span>Kopiuj link</span>
          </button>

          {/* Chat (if joined) */}
          <button
            disabled
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Otwórz czat</span>
          </button>

          {/* Mute */}
          <button
            disabled
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <BellOff className="h-5 w-5" />
            <span>Wycisz powiadomienia</span>
          </button>

          {/* Report */}
          <button
            disabled
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Flag className="h-5 w-5" />
            <span>Zgłoś</span>
          </button>
        </div>
      </div>

      {/* Invite Links (Owner/Mod only) */}
      {event.inviteLinks && event.inviteLinks.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Linki zaproszeń
          </h3>

          <div className="space-y-2">
            {event.inviteLinks.map((link) => (
              <div
                key={link.code}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="mb-1 flex items-center justify-between">
                  <code className="text-xs font-mono text-gray-900 dark:text-gray-100">
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
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
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
      {event.sponsorship?.highlightOn &&
        event.sponsorship.status === 'ACTIVE' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <h3 className="mb-2 text-sm font-semibold text-yellow-900 dark:text-yellow-100">
              Wydarzenie wyróżnione
            </h3>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              To wydarzenie jest sponsorowane przez{' '}
              <span className="font-medium">
                {event.sponsorship.sponsor.name}
              </span>
            </p>
            {event.sponsorship.endsAt && (
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                Wyróżnienie do{' '}
                {new Date(event.sponsorship.endsAt).toLocaleDateString('pl-PL')}
              </p>
            )}
          </div>
        )}
    </div>
  );
}
