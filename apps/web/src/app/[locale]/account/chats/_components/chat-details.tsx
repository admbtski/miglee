/**
 * Chat Details Component - Settings panel for chat
 */

'use client';

import { useState } from 'react';
import {
  Bell,
  ChevronDown,
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
import type { ChatKind } from '../_types';
import { Section, Row } from './chat-details-section';

type ChatDetailsProps = {
  onClose: () => void;
  kind: ChatKind;
};

export function ChatDetails({ onClose, kind }: ChatDetailsProps) {
  const [openCustomize, setOpenCustomize] = useState(true);

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-4 bg-white border-b border-zinc-200 dark:border-zinc-800 dark:bg-[#141518]">
        <div className="text-sm font-semibold">
          {kind === 'channel' ? 'Channel details' : 'Conversation details'}
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
        <Section title="Notifications">
          <Row icon={<Bell className="w-4 h-4" />} label="Mute notifications" />
        </Section>

        <div className="mb-6">
          <button
            onClick={() => setOpenCustomize((x) => !x)}
            className="flex items-center justify-between w-full px-1 pb-2 text-xs font-semibold tracking-wide uppercase text-zinc-500"
          >
            <span>Customize {kind === 'channel' ? 'channel' : 'chat'}</span>
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
                  kind === 'channel'
                    ? 'Change channel name'
                    : 'Change chat name'
                }
              />
              <Row
                icon={<ImageIcon className="w-4 h-4" />}
                label="Change photo"
              />
              <Row
                icon={<Palette className="w-4 h-4" />}
                label="Change theme"
              />
              <Row
                icon={<ThumbsUp className="w-4 h-4" />}
                label="Change emoji"
              />
            </div>
          )}
        </div>

        <Section
          title={kind === 'channel' ? 'Channel members' : 'Participants'}
        >
          <Row
            icon={<Users className="w-4 h-4" />}
            label={kind === 'channel' ? 'Manage members' : 'View profile'}
          />
        </Section>

        <Section title="Media, files and links">
          <Row icon={<ImageIcon className="w-4 h-4" />} label="Media" />
          <Row icon={<LinkIcon className="w-4 h-4" />} label="Links" />
        </Section>

        <Section title="Privacy & support">
          <Row
            icon={<Shield className="w-4 h-4" />}
            label={
              kind === 'channel' ? 'Channel privacy' : 'Conversation privacy'
            }
          />
          {kind === 'channel' && (
            <Row
              icon={<Pin className="w-4 h-4" />}
              label="View pinned messages"
            />
          )}
        </Section>
      </div>
    </div>
  );
}

