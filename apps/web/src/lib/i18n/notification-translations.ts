/**
 * Notification translations with interpolation support
 *
 * Each NotificationKind has:
 * - title: Short title for the notification
 * - body: Longer description with optional {{variable}} placeholders
 *
 * Variables in body are replaced with values from notification.data JSON
 */

export type NotificationKind =
  // Intent lifecycle
  | 'INTENT_CREATED'
  | 'INTENT_UPDATED'
  | 'INTENT_CANCELED'
  | 'INTENT_DELETED'
  // Membership
  | 'INTENT_INVITE'
  | 'INTENT_INVITE_ACCEPTED'
  | 'INTENT_MEMBERSHIP_APPROVED'
  | 'INTENT_MEMBERSHIP_REJECTED'
  | 'INTENT_MEMBER_KICKED'
  | 'INTENT_MEMBER_ROLE_CHANGED'
  | 'JOIN_REQUEST'
  | 'BANNED'
  | 'UNBANNED'
  // Waitlist
  | 'WAITLIST_JOINED'
  | 'WAITLIST_PROMOTED'
  // Reviews & Feedback
  | 'INTENT_REVIEW_RECEIVED'
  | 'INTENT_FEEDBACK_RECEIVED'
  | 'INTENT_FEEDBACK_REQUEST'
  | 'REVIEW_HIDDEN'
  // Comments
  | 'INTENT_COMMENT_ADDED'
  | 'COMMENT_REPLY'
  | 'COMMENT_HIDDEN'
  // Messages
  | 'NEW_MESSAGE'
  | 'NEW_COMMENT'
  | 'NEW_REVIEW'
  | 'INTENT_CHAT_MESSAGE'
  // Reminders & System
  | 'INTENT_REMINDER'
  | 'SYSTEM';

export interface NotificationTranslation {
  title: string;
  body: string;
}

type NotificationTranslations = Record<
  NotificationKind,
  NotificationTranslation
>;

export const notificationTranslations: Record<
  string,
  NotificationTranslations
> = {
  pl: {
    // Intent lifecycle
    INTENT_CREATED: {
      title: 'Nowe wydarzenie',
      body: 'Utworzono nowe wydarzenie.',
    },
    INTENT_UPDATED: {
      title: 'Wydarzenie zaktualizowane',
      body: 'Wydarzenie "{{intentTitle}}" zostało zaktualizowane.',
    },
    INTENT_CANCELED: {
      title: 'Wydarzenie anulowane',
      body: '{{reason}}',
    },
    INTENT_DELETED: {
      title: 'Wydarzenie usunięte',
      body: 'Wydarzenie zostało trwale usunięte.',
    },

    // Membership
    INTENT_INVITE: {
      title: 'Zaproszenie do wydarzenia',
      body: 'Zostałeś zaproszony do wydarzenia "{{intentTitle}}".',
    },
    INTENT_INVITE_ACCEPTED: {
      title: 'Zaproszenie zaakceptowane',
      body: '{{actorName}} zaakceptował(a) zaproszenie do wydarzenia.',
    },
    INTENT_MEMBERSHIP_APPROVED: {
      title: 'Prośba zaakceptowana',
      body: 'Twoja prośba o dołączenie do "{{intentTitle}}" została zaakceptowana.',
    },
    INTENT_MEMBERSHIP_REJECTED: {
      title: 'Prośba odrzucona',
      body: 'Twoja prośba o dołączenie do "{{intentTitle}}" została odrzucona.{{reason}}',
    },
    INTENT_MEMBER_KICKED: {
      title: 'Usunięto z wydarzenia',
      body: 'Zostałeś usunięty z wydarzenia.{{reason}}',
    },
    INTENT_MEMBER_ROLE_CHANGED: {
      title: 'Zmiana roli',
      body: 'Twoja rola została zmieniona na {{newRole}}.',
    },
    JOIN_REQUEST: {
      title: 'Nowa prośba o dołączenie',
      body: '{{actorName}} prosi o dołączenie do Twojego wydarzenia.',
    },
    BANNED: {
      title: 'Zablokowano',
      body: 'Zostałeś zablokowany w wydarzeniu.{{reason}}',
    },
    UNBANNED: {
      title: 'Odblokowano',
      body: 'Blokada została zdjęta. Możesz ponownie poprosić o dołączenie.',
    },

    // Waitlist
    WAITLIST_JOINED: {
      title: 'Dodano do listy oczekujących',
      body: '{{actorName}} dołączył(a) do listy oczekujących.',
    },
    WAITLIST_PROMOTED: {
      title: 'Awans z listy oczekujących',
      body: 'Zostałeś awansowany z listy oczekujących! Teraz jesteś uczestnikiem.',
    },

    // Reviews & Feedback
    INTENT_REVIEW_RECEIVED: {
      title: 'Nowa recenzja',
      body: '{{actorName}} wystawił(a) recenzję ({{rating}} ⭐){{reviewContent}}',
    },
    INTENT_FEEDBACK_RECEIVED: {
      title: 'Nowy feedback',
      body: '{{actorName}} przesłał(a) feedback ({{rating}} ⭐).',
    },
    INTENT_FEEDBACK_REQUEST: {
      title: 'Podziel się opinią',
      body: 'Jak oceniasz wydarzenie "{{intentTitle}}"? Podziel się swoją opinią.',
    },
    REVIEW_HIDDEN: {
      title: 'Recenzja ukryta',
      body: 'Twoja recenzja została ukryta przez {{moderatorName}}.',
    },

    // Comments
    INTENT_COMMENT_ADDED: {
      title: 'Nowy komentarz',
      body: '{{actorName}}: {{commentContent}}',
    },
    COMMENT_REPLY: {
      title: 'Odpowiedź na komentarz',
      body: '{{actorName}}: {{commentContent}}',
    },
    COMMENT_HIDDEN: {
      title: 'Komentarz ukryty',
      body: 'Twój komentarz został ukryty przez {{moderatorName}}.',
    },

    // Messages
    NEW_MESSAGE: {
      title: 'Nowa wiadomość',
      body: '{{actorName}}: {{messageContent}}',
    },
    NEW_COMMENT: {
      title: 'Nowy komentarz',
      body: '{{actorName}} dodał(a) komentarz.',
    },
    NEW_REVIEW: {
      title: 'Nowa recenzja',
      body: '{{actorName}} wystawił(a) recenzję ({{rating}} ⭐).',
    },
    INTENT_CHAT_MESSAGE: {
      title: 'Nowa wiadomość w czacie',
      body: '{{actorName}}: {{messageContent}}',
    },

    // Reminders & System
    INTENT_REMINDER: {
      title: 'Przypomnienie o wydarzeniu',
      body: 'Wydarzenie "{{intentTitle}}" zaczyna się {{startsIn}}.',
    },
    SYSTEM: {
      title: 'Powiadomienie systemowe',
      body: '{{message}}',
    },
  },

  en: {
    // Intent lifecycle
    INTENT_CREATED: {
      title: 'New event',
      body: 'A new event has been created.',
    },
    INTENT_UPDATED: {
      title: 'Event updated',
      body: 'Event "{{intentTitle}}" has been updated.',
    },
    INTENT_CANCELED: {
      title: 'Event canceled',
      body: '{{reason}}',
    },
    INTENT_DELETED: {
      title: 'Event deleted',
      body: 'The event has been permanently deleted.',
    },

    // Membership
    INTENT_INVITE: {
      title: 'Event invitation',
      body: 'You have been invited to "{{intentTitle}}".',
    },
    INTENT_INVITE_ACCEPTED: {
      title: 'Invitation accepted',
      body: '{{actorName}} accepted your invitation to join the event.',
    },
    INTENT_MEMBERSHIP_APPROVED: {
      title: 'Request approved',
      body: 'Your request to join "{{intentTitle}}" has been approved.',
    },
    INTENT_MEMBERSHIP_REJECTED: {
      title: 'Request rejected',
      body: 'Your request to join "{{intentTitle}}" was rejected.{{reason}}',
    },
    INTENT_MEMBER_KICKED: {
      title: 'Removed from event',
      body: 'You have been removed from the event.{{reason}}',
    },
    INTENT_MEMBER_ROLE_CHANGED: {
      title: 'Role changed',
      body: 'Your role has been changed to {{newRole}}.',
    },
    JOIN_REQUEST: {
      title: 'New join request',
      body: '{{actorName}} is requesting to join your event.',
    },
    BANNED: {
      title: 'Banned',
      body: 'You have been banned from the event.{{reason}}',
    },
    UNBANNED: {
      title: 'Unbanned',
      body: 'Your ban has been lifted. You can request to join again.',
    },

    // Waitlist
    WAITLIST_JOINED: {
      title: 'Added to waitlist',
      body: '{{actorName}} joined the waitlist.',
    },
    WAITLIST_PROMOTED: {
      title: 'Promoted from waitlist',
      body: "You've been promoted from the waitlist! You're now a participant.",
    },

    // Reviews & Feedback
    INTENT_REVIEW_RECEIVED: {
      title: 'New review',
      body: '{{actorName}} left a review ({{rating}} ⭐){{reviewContent}}',
    },
    INTENT_FEEDBACK_RECEIVED: {
      title: 'New feedback',
      body: '{{actorName}} submitted feedback ({{rating}} ⭐).',
    },
    INTENT_FEEDBACK_REQUEST: {
      title: 'Share your feedback',
      body: 'How was "{{intentTitle}}"? Share your feedback.',
    },
    REVIEW_HIDDEN: {
      title: 'Review hidden',
      body: 'Your review has been hidden by {{moderatorName}}.',
    },

    // Comments
    INTENT_COMMENT_ADDED: {
      title: 'New comment',
      body: '{{actorName}}: {{commentContent}}',
    },
    COMMENT_REPLY: {
      title: 'Reply to your comment',
      body: '{{actorName}}: {{commentContent}}',
    },
    COMMENT_HIDDEN: {
      title: 'Comment hidden',
      body: 'Your comment has been hidden by {{moderatorName}}.',
    },

    // Messages
    NEW_MESSAGE: {
      title: 'New message',
      body: '{{actorName}}: {{messageContent}}',
    },
    NEW_COMMENT: {
      title: 'New comment',
      body: '{{actorName}} added a comment.',
    },
    NEW_REVIEW: {
      title: 'New review',
      body: '{{actorName}} left a review ({{rating}} ⭐).',
    },
    INTENT_CHAT_MESSAGE: {
      title: 'New chat message',
      body: '{{actorName}}: {{messageContent}}',
    },

    // Reminders & System
    INTENT_REMINDER: {
      title: 'Event reminder',
      body: 'Event "{{intentTitle}}" starts {{startsIn}}.',
    },
    SYSTEM: {
      title: 'System notification',
      body: '{{message}}',
    },
  },

  de: {
    // Intent lifecycle
    INTENT_CREATED: {
      title: 'Neues Event',
      body: 'Ein neues Event wurde erstellt.',
    },
    INTENT_UPDATED: {
      title: 'Event aktualisiert',
      body: 'Event "{{intentTitle}}" wurde aktualisiert.',
    },
    INTENT_CANCELED: {
      title: 'Event abgesagt',
      body: '{{reason}}',
    },
    INTENT_DELETED: {
      title: 'Event gelöscht',
      body: 'Das Event wurde dauerhaft gelöscht.',
    },

    // Membership
    INTENT_INVITE: {
      title: 'Event-Einladung',
      body: 'Du wurdest zu "{{intentTitle}}" eingeladen.',
    },
    INTENT_INVITE_ACCEPTED: {
      title: 'Einladung angenommen',
      body: '{{actorName}} hat deine Einladung angenommen.',
    },
    INTENT_MEMBERSHIP_APPROVED: {
      title: 'Anfrage genehmigt',
      body: 'Deine Anfrage für "{{intentTitle}}" wurde genehmigt.',
    },
    INTENT_MEMBERSHIP_REJECTED: {
      title: 'Anfrage abgelehnt',
      body: 'Deine Anfrage für "{{intentTitle}}" wurde abgelehnt.{{reason}}',
    },
    INTENT_MEMBER_KICKED: {
      title: 'Vom Event entfernt',
      body: 'Du wurdest vom Event entfernt.{{reason}}',
    },
    INTENT_MEMBER_ROLE_CHANGED: {
      title: 'Rolle geändert',
      body: 'Deine Rolle wurde zu {{newRole}} geändert.',
    },
    JOIN_REQUEST: {
      title: 'Neue Beitrittsanfrage',
      body: '{{actorName}} möchte deinem Event beitreten.',
    },
    BANNED: {
      title: 'Gesperrt',
      body: 'Du wurdest vom Event gesperrt.{{reason}}',
    },
    UNBANNED: {
      title: 'Entsperrt',
      body: 'Deine Sperre wurde aufgehoben. Du kannst erneut anfragen.',
    },

    // Waitlist
    WAITLIST_JOINED: {
      title: 'Zur Warteliste hinzugefügt',
      body: '{{actorName}} hat sich auf die Warteliste gesetzt.',
    },
    WAITLIST_PROMOTED: {
      title: 'Von Warteliste befördert',
      body: 'Du wurdest von der Warteliste befördert! Du bist jetzt Teilnehmer.',
    },

    // Reviews & Feedback
    INTENT_REVIEW_RECEIVED: {
      title: 'Neue Bewertung',
      body: '{{actorName}} hat eine Bewertung hinterlassen ({{rating}} ⭐){{reviewContent}}',
    },
    INTENT_FEEDBACK_RECEIVED: {
      title: 'Neues Feedback',
      body: '{{actorName}} hat Feedback gesendet ({{rating}} ⭐).',
    },
    INTENT_FEEDBACK_REQUEST: {
      title: 'Teile dein Feedback',
      body: 'Wie war "{{intentTitle}}"? Teile dein Feedback.',
    },
    REVIEW_HIDDEN: {
      title: 'Bewertung ausgeblendet',
      body: 'Deine Bewertung wurde von {{moderatorName}} ausgeblendet.',
    },

    // Comments
    INTENT_COMMENT_ADDED: {
      title: 'Neuer Kommentar',
      body: '{{actorName}}: {{commentContent}}',
    },
    COMMENT_REPLY: {
      title: 'Antwort auf deinen Kommentar',
      body: '{{actorName}}: {{commentContent}}',
    },
    COMMENT_HIDDEN: {
      title: 'Kommentar ausgeblendet',
      body: 'Dein Kommentar wurde von {{moderatorName}} ausgeblendet.',
    },

    // Messages
    NEW_MESSAGE: {
      title: 'Neue Nachricht',
      body: '{{actorName}}: {{messageContent}}',
    },
    NEW_COMMENT: {
      title: 'Neuer Kommentar',
      body: '{{actorName}} hat einen Kommentar hinzugefügt.',
    },
    NEW_REVIEW: {
      title: 'Neue Bewertung',
      body: '{{actorName}} hat eine Bewertung hinterlassen ({{rating}} ⭐).',
    },
    INTENT_CHAT_MESSAGE: {
      title: 'Neue Chat-Nachricht',
      body: '{{actorName}}: {{messageContent}}',
    },

    // Reminders & System
    INTENT_REMINDER: {
      title: 'Event-Erinnerung',
      body: 'Event "{{intentTitle}}" beginnt {{startsIn}}.',
    },
    SYSTEM: {
      title: 'Systembenachrichtigung',
      body: '{{message}}',
    },
  },
};

/**
 * Interpolate variables in a template string
 * Replaces {{variableName}} with values from data object
 */
function interpolate(
  template: string,
  data: Record<string, unknown> | null | undefined
): string {
  if (!data) return template.replace(/\{\{[^}]+\}\}/g, '');

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

/**
 * Get translated notification content
 */
export function getNotificationContent(
  kind: string,
  data: Record<string, unknown> | null | undefined,
  locale: string = 'en'
): { title: string; body: string } {
  const translations =
    notificationTranslations[locale] || notificationTranslations.en;
  const translation = translations[kind as NotificationKind];

  if (!translation) {
    return {
      title: 'Notification',
      body: '',
    };
  }

  return {
    title: interpolate(translation.title, data),
    body: interpolate(translation.body, data),
  };
}

/**
 * Format relative time for reminders
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = 'en'
): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  const formats: Record<string, Record<string, string>> = {
    pl: {
      inMinutes: `za ${diffMins} min`,
      inHours: `za ${diffHours} godz.`,
      inDays: `za ${diffDays} dni`,
      soon: 'wkrótce',
    },
    en: {
      inMinutes: `in ${diffMins} min`,
      inHours: `in ${diffHours} hours`,
      inDays: `in ${diffDays} days`,
      soon: 'soon',
    },
    de: {
      inMinutes: `in ${diffMins} Min.`,
      inHours: `in ${diffHours} Std.`,
      inDays: `in ${diffDays} Tagen`,
      soon: 'bald',
    },
  };

  const t = formats[locale] || formats.en;

  if (diffMins < 0) return t.soon;
  if (diffMins < 60) return t.inMinutes;
  if (diffHours < 24) return t.inHours;
  return t.inDays;
}

/**
 * Role translations for INTENT_MEMBER_ROLE_CHANGED
 */
export const roleTranslations: Record<string, Record<string, string>> = {
  pl: {
    OWNER: 'właściciel',
    MODERATOR: 'moderator',
    PARTICIPANT: 'uczestnik',
  },
  en: {
    OWNER: 'owner',
    MODERATOR: 'moderator',
    PARTICIPANT: 'participant',
  },
  de: {
    OWNER: 'Eigentümer',
    MODERATOR: 'Moderator',
    PARTICIPANT: 'Teilnehmer',
  },
};

export function getLocalizedRole(role: string, locale: string = 'en'): string {
  const roles = roleTranslations[locale] || roleTranslations.en;
  return roles[role] || role;
}
