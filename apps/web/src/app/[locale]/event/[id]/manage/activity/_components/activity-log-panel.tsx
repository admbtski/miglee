'use client';

/**
 * Activity Log Panel
 *
 * Client component wrapper for the audit log timeline.
 * Handles prefetching and query client integration.
 */

import { AuditLogTimeline } from '@/features/audit';

interface ActivityLogPanelProps {
  eventId: string;
}

export function ActivityLogPanel({ eventId }: ActivityLogPanelProps) {
  return <AuditLogTimeline eventId={eventId} />;
}

