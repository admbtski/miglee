'use client';

/**
 * Audit Log Item Component
 *
 * Displays a single audit log entry with icon, description, and metadata.
 */

import { formatDistanceToNow } from '@/lib/date';
import {
  Calendar,
  Edit,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Shield,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
  Clock,
  Ban,
  Check,
  Link,
} from 'lucide-react';
import type { AuditLogItem as AuditLogItemType } from '../types';

interface AuditLogItemProps {
  item: AuditLogItemType;
  onShowDetails?: (item: AuditLogItemType) => void;
}

// Icon and color mapping for scope/action combinations
function getIconAndColor(scope: string, action: string) {
  const scopeConfig: Record<string, { icon: React.ElementType; color: string }> = {
    EVENT: { icon: Calendar, color: 'text-indigo-500' },
    PUBLICATION: { icon: Eye, color: 'text-emerald-500' },
    MEMBER: { icon: Users, color: 'text-sky-500' },
    MODERATION: { icon: Shield, color: 'text-amber-500' },
    CHECKIN: { icon: Check, color: 'text-violet-500' },
    INVITE_LINK: { icon: Link, color: 'text-purple-500' },
    COMMENT: { icon: Edit, color: 'text-zinc-500' },
    REVIEW: { icon: Edit, color: 'text-zinc-500' },
    AGENDA: { icon: Clock, color: 'text-blue-500' },
    FAQ: { icon: Edit, color: 'text-zinc-500' },
    BILLING: { icon: Settings, color: 'text-emerald-500' },
    SYSTEM: { icon: Settings, color: 'text-zinc-500' },
  };

  const actionIcons: Record<string, React.ElementType> = {
    CREATE: Plus,
    UPDATE: Edit,
    DELETE: Trash2,
    PUBLISH: Eye,
    UNPUBLISH: EyeOff,
    SCHEDULE: Clock,
    CANCEL: Ban,
    INVITE: UserPlus,
    APPROVE: Check,
    REJECT: UserMinus,
    KICK: UserMinus,
    BAN: Ban,
    UNBAN: Check,
    LEAVE: LogOut,
    HIDE: EyeOff,
    UNHIDE: Eye,
    STATUS_CHANGE: Edit,
    ROLE_CHANGE: User,
    CONFIG_CHANGE: Settings,
    WAITLIST: LogIn,
    WAITLIST_LEAVE: LogOut,
    WAITLIST_PROMOTE: UserPlus,
  };

  const config = scopeConfig[scope] || { icon: Settings, color: 'text-zinc-500' };
  const Icon = actionIcons[action] || config.icon;

  return { Icon, color: config.color };
}

// Generate human-readable description
function getDescription(item: AuditLogItemType): string {
  const actorName = item.actor?.name || 'System'; // TODO i18n
  const reason = (item.meta?.reason as string) || '';

  const descriptions: Record<string, Record<string, string>> = {
    EVENT: {
      CREATE: `${actorName} created the event`, // TODO i18n
      UPDATE: `${actorName} updated the event`, // TODO i18n
      DELETE: `${actorName} deleted the event`, // TODO i18n
      CANCEL: `${actorName} canceled the event${reason ? `: ${reason}` : ''}`, // TODO i18n
      CONFIG_CHANGE: `${actorName} changed event settings`, // TODO i18n
    },
    PUBLICATION: {
      PUBLISH: `${actorName} published the event`, // TODO i18n
      UNPUBLISH: `${actorName} unpublished the event`, // TODO i18n
      SCHEDULE: `${actorName} scheduled publication`, // TODO i18n
    },
    MEMBER: {
      INVITE: `${actorName} invited a user`, // TODO i18n
      APPROVE: `${actorName} approved a join request`, // TODO i18n
      REJECT: `${actorName} rejected a join request`, // TODO i18n
      KICK: `${actorName} removed a member`, // TODO i18n
      ROLE_CHANGE: `${actorName} changed a member's role`, // TODO i18n
      LEAVE: `${actorName} left the event`, // TODO i18n
      STATUS_CHANGE: `${actorName} changed membership status`, // TODO i18n
      WAITLIST: `${actorName} joined the waitlist`, // TODO i18n
      WAITLIST_LEAVE: `${actorName} left the waitlist`, // TODO i18n
      WAITLIST_PROMOTE: `${actorName} promoted from waitlist`, // TODO i18n
    },
    MODERATION: {
      BAN: `${actorName} banned a user`, // TODO i18n
      UNBAN: `${actorName} unbanned a user`, // TODO i18n
      HIDE: `${actorName} hid content`, // TODO i18n
      UNHIDE: `${actorName} restored content`, // TODO i18n
    },
    CHECKIN: {
      CONFIG_CHANGE: `${actorName} changed check-in settings`, // TODO i18n
      REJECT: `${actorName} rejected a check-in`, // TODO i18n
    },
    INVITE_LINK: {
      CREATE: `${actorName} created an invite link`, // TODO i18n
      UPDATE: `${actorName} updated an invite link`, // TODO i18n
      DELETE: `${actorName} deleted an invite link`, // TODO i18n
    },
  };

  return (
    descriptions[item.scope]?.[item.action] ||
    `${actorName} performed ${item.action.toLowerCase()} on ${item.scope.toLowerCase()}` // TODO i18n
  );
}

// Severity indicator
function SeverityBadge({ severity }: { severity: number }) {
  const config: Record<number, { label: string; className: string }> = {
    1: { label: 'Info', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
    2: { label: 'Normal', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' },
    3: { label: 'Important', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    4: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
    5: { label: 'Security', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  };

  const { label, className } = config[severity] ?? config[2]!;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label /* TODO i18n */}
    </span>
  );
}

export function AuditLogItem({ item, onShowDetails }: AuditLogItemProps) {
  const { Icon, color } = getIconAndColor(item.scope, item.action);
  const description = getDescription(item);
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }); // TODO i18n: date formatting should be locale-aware

  return (
    <div className="flex gap-4 py-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-900 dark:text-zinc-100">
              {description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {timeAgo}
              </span>
              {item.severity >= 3 && <SeverityBadge severity={item.severity} />}
            </div>
          </div>

          {/* Details button */}
          {(item.diff || item.meta) && onShowDetails && (
            <button
              onClick={() => onShowDetails(item)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0"
              aria-label="Show details" // TODO i18n
            >
              Details {/* TODO i18n */}
            </button>
          )}
        </div>

        {/* Show changed fields if any */}
        {item.diff && Object.keys(item.diff).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.keys(item.diff).slice(0, 3).map((field) => (
              <span
                key={field}
                className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400"
              >
                {field}
              </span>
            ))}
            {Object.keys(item.diff).length > 3 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                +{Object.keys(item.diff).length - 3} more {/* TODO i18n */}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

