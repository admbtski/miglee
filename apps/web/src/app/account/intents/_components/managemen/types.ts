'use client';

export type IntentMemberRole = 'OWNER' | 'MODERATOR' | 'PARTICIPANT';
export type IntentMemberStatus =
  | 'JOINED'
  | 'INVITED'
  | 'PENDING'
  | 'REJECTED'
  | 'BANNED'
  | 'LEFT'
  | 'KICKED';

export type IntentMember = {
  id: string;
  intentId: string;
  userId: string;
  role: IntentMemberRole;
  status: IntentMemberStatus;
  joinedAt?: string | null;
  leftAt?: string | null;
  note?: string | null;
  user: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
};

export type ManageCallbacks = {
  onPromoteToModerator?: (member: IntentMember) => void | Promise<void>;
  onDemoteToParticipant?: (member: IntentMember) => void | Promise<void>;
  onMakeOwner?: (member: IntentMember) => void | Promise<void>;
  onKick?: (member: IntentMember) => void | Promise<void>;
  onBan?: (member: IntentMember) => void | Promise<void>;
  onUnban?: (member: IntentMember) => void | Promise<void>;
  onReinvite?: (member: IntentMember) => void | Promise<void>;
  onCancelInvite?: (member: IntentMember) => void | Promise<void>;
  onApprovePending?: (member: IntentMember) => void | Promise<void>;
  onRejectPending?: (member: IntentMember) => void | Promise<void>;
  onNotifyPremium?: (intentId: string) => void | Promise<void>;
};

export type EventManagementModalProps = ManageCallbacks & {
  open: boolean;
  onClose: () => void;
  intentId: string;
  members: IntentMember[];
  canManage: boolean;
  isPremium?: boolean;
  stats?: Partial<Record<IntentMemberStatus, number>>;
  onInvited?: (invitedUserIds: string[]) => void;
};

export const STATUS_GROUP_ORDER: IntentMemberStatus[] = [
  'JOINED',
  'PENDING',
  'INVITED',
  'REJECTED',
  'LEFT',
  'KICKED',
  'BANNED',
];

export const ROLE_BADGE_CLASSES: Record<IntentMemberRole, string> = {
  OWNER: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
  MODERATOR: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200',
  PARTICIPANT: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200',
};

export const STATUS_BADGE_CLASSES: Record<IntentMemberStatus, string> = {
  JOINED:
    'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200',
  INVITED: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-200',
  PENDING:
    'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200',
  REJECTED:
    'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200',
  LEFT: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200',
  KICKED: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200',
  BANNED: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
};

export const READONLY_STATUSES: IntentMemberStatus[] = [
  'LEFT',
  'REJECTED',
  'KICKED',
  'BANNED',
];

export function groupMembers(members: IntentMember[]) {
  const map = new Map<IntentMemberStatus, IntentMember[]>();
  for (const s of STATUS_GROUP_ORDER) map.set(s, []);
  for (const m of members) map.get(m.status)!.push(m);
  const roleRank = (r: IntentMemberRole) =>
    r === 'OWNER' ? 0 : r === 'MODERATOR' ? 1 : 2;
  for (const s of STATUS_GROUP_ORDER) {
    map.get(s)!.sort((a, b) => {
      const rr = roleRank(a.role) - roleRank(b.role);
      if (rr !== 0) return rr;
      return a.user.name.localeCompare(b.user.name, 'pl');
    });
  }
  return map;
}
