'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  getNotificationContent,
  formatRelativeTime,
  getLocalizedRole,
} from './notification-translations';

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
 * Hook to get localized notification content
 * Falls back to stored title/body if translation not available
 */
export function useNotificationContent(notification: NotificationInput) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return useMemo(() => {
    const {
      kind,
      title: storedTitle,
      body: storedBody,
      data,
      actor,
      event,
    } = notification;

    // Build data object with all available information
    const enrichedData: NotificationData = {
      ...(data || {}),
      // Add actor name if available
      actorName: data?.actorName || actor?.name || undefined,
      // Add event title if available
      eventTitle: data?.eventTitle || event?.title || undefined,
    };

    // Translate role if present
    if (enrichedData.newRole) {
      enrichedData.newRole = getLocalizedRole(enrichedData.newRole, locale);
    }

    // Format relative time for reminders
    if (enrichedData.startsAt && !enrichedData.startsIn) {
      enrichedData.startsIn = formatRelativeTime(enrichedData.startsAt, locale);
    }

    // Format reason with prefix if exists
    if (enrichedData.reason) {
      enrichedData.reason = ` ${locale === 'pl' ? 'Powód:' : locale === 'de' ? 'Grund:' : 'Reason:'} ${enrichedData.reason}`;
    }

    // Get translated content
    const translated = getNotificationContent(kind, enrichedData, locale);

    // Use translated content, fall back to stored if translation is empty
    return {
      title: translated.title || storedTitle || 'Notification',
      body: translated.body || storedBody || '',
    };
  }, [notification, locale]);
}

/**
 * Non-hook version for use outside of components
 */
export function getLocalizedNotificationContent(
  notification: NotificationInput,
  locale: string = 'en'
) {
  const {
    kind,
    title: storedTitle,
    body: storedBody,
    data,
    actor,
    event,
  } = notification;

  const enrichedData: NotificationData = {
    ...(data || {}),
    actorName: data?.actorName || actor?.name || undefined,
    eventTitle: data?.eventTitle || event?.title || undefined,
  };

  if (enrichedData.newRole) {
    enrichedData.newRole = getLocalizedRole(enrichedData.newRole, locale);
  }

  if (enrichedData.startsAt && !enrichedData.startsIn) {
    enrichedData.startsIn = formatRelativeTime(enrichedData.startsAt, locale);
  }

  if (enrichedData.reason) {
    enrichedData.reason = ` ${locale === 'pl' ? 'Powód:' : locale === 'de' ? 'Grund:' : 'Reason:'} ${enrichedData.reason}`;
  }

  const translated = getNotificationContent(kind, enrichedData, locale);

  return {
    title: translated.title || storedTitle || 'Notification',
    body: translated.body || storedBody || '',
  };
}
