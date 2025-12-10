'use client';

import { useMemo } from 'react';
import { useI18n } from './provider-ssr';

export interface NotificationData {
  // Common
  eventId?: string;
  eventTitle?: string;
  actorName?: string;

  // Messages
  preview?: string;
  messageContent?: string;

  // Comments
  commentContent?: string;

  // Reviews/Feedback
  rating?: number;
  reviewContent?: string;
  hasFeedback?: boolean;

  // Moderation
  moderatorName?: string;

  // Membership
  reason?: string;
  newRole?: string;
  addedToWaitlist?: boolean;

  // Reminders
  startsAt?: string;
  startsIn?: string;

  // System
  message?: string;

  // Event updates
  changedFields?: string[];
  changesDescription?: string;
  changes?: Record<string, { old?: unknown; new?: unknown }>;

  // Allow any additional fields
  [key: string]: unknown;
}

export interface NotificationInput {
  kind: string;
  title?: string | null;
  body?: string | null;
  data?: NotificationData | null;
  actor?: {
    name?: string | null;
  } | null;
  event?: {
    title?: string | null;
  } | null;
}

/**
 * Interpolate variables in a template string
 * Replaces {{variableName}} with values from data object
 */
function interpolate(
  template: string,
  data: Record<string, unknown> | null | undefined
): string {
  if (!data) return template.replace(/\{\{[^}]+\}\}/g, '');

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = data[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

/**
 * Format relative time for reminders
 */
function formatRelativeTime(
  date: Date | string,
  relativeTimeTranslations: {
    inMinutes: string;
    inHours: string;
    inDays: string;
    soon: string;
  }
): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 0) return relativeTimeTranslations.soon;
  if (diffMins < 60)
    return relativeTimeTranslations.inMinutes.replace(
      '{{count}}',
      String(diffMins)
    );
  if (diffHours < 24)
    return relativeTimeTranslations.inHours.replace(
      '{{count}}',
      String(diffHours)
    );
  return relativeTimeTranslations.inDays.replace('{{count}}', String(diffDays));
}

/**
 * Hook to get localized notification content
 * Falls back to stored title/body if translation not available
 */
export function useNotificationContent(notification: NotificationInput) {
  const { t } = useI18n();

  return useMemo(() => {
    const {
      kind,
      title: storedTitle,
      body: storedBody,
      data,
      actor,
      event,
    } = notification;

    const notificationContent = t.notifications.content as Record<
      string,
      { title: string; body: string } | undefined
    >;
    const roles = t.notifications.roles as Record<string, string>;
    const relativeTime = t.notifications.relativeTime;
    const reasonPrefix = t.notifications.reasonPrefix;
    const changedFieldsTranslations = t.notifications.changedFields as Record<
      string,
      string
    >;
    const changesPrefix = t.notifications.changesPrefix;

    // Build data object with all available information
    const enrichedData: NotificationData = {
      ...(data || {}),
      // Add actor name if available
      actorName: data?.actorName || actor?.name || undefined,
      // Add event title if available
      eventTitle: data?.eventTitle || event?.title || undefined,
    };

    // Translate role if present
    if (enrichedData.newRole && roles[enrichedData.newRole]) {
      enrichedData.newRole = roles[enrichedData.newRole];
    }

    // Format relative time for reminders
    if (enrichedData.startsAt && !enrichedData.startsIn) {
      enrichedData.startsIn = formatRelativeTime(
        enrichedData.startsAt,
        relativeTime
      );
    }

    // Format reason with prefix if exists
    if (enrichedData.reason) {
      enrichedData.reason = ` ${reasonPrefix} ${enrichedData.reason}`;
    }

    // Format changed fields for EVENT_UPDATED
    if (kind === 'EVENT_UPDATED') {
      if (
        enrichedData.changedFields &&
        Array.isArray(enrichedData.changedFields) &&
        enrichedData.changedFields.length > 0
      ) {
        const translatedFields = enrichedData.changedFields
          .map((field) => changedFieldsTranslations[field] || field)
          .filter(Boolean);

        if (translatedFields.length > 0) {
          enrichedData.changesDescription = `${changesPrefix} ${translatedFields.join(', ')}`;
        }
      }
      // Fallback - if no changesDescription, set to empty string to avoid showing {{changesDescription}}
      if (!enrichedData.changesDescription) {
        enrichedData.changesDescription = '';
      }
    }

    // Get translated content
    const translation = notificationContent[kind];

    if (!translation) {
      return {
        title: storedTitle || 'Notification',
        body: storedBody || '',
      };
    }

    // Use translated content, fall back to stored if translation is empty
    return {
      title:
        interpolate(translation.title, enrichedData) ||
        storedTitle ||
        'Notification',
      body: interpolate(translation.body, enrichedData) || storedBody || '',
    };
  }, [notification, t]);
}

/**
 * Get localized role translation
 */
export function getLocalizedRole(
  role: string,
  roles: Record<string, string>
): string {
  return roles[role] ?? role;
}
