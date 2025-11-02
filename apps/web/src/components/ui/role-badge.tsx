import { Crown, Shield, UserIcon } from 'lucide-react';

export type ParticipantRole = 'OWNER' | 'MODERATOR' | 'PARTICIPANT';

export function RoleBadge({ role }: { role: ParticipantRole }) {
  if (role === 'OWNER') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Crown className="w-3 h-3" /> Owner
      </span>
    );
  }
  if (role === 'MODERATOR') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
        <Shield className="w-3 h-3" /> Moderator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
      <UserIcon className="w-3 h-3" /> Uczestnik
    </span>
  );
}
