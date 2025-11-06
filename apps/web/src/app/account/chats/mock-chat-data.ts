// mock-chat-data.ts

export const MOCK_NOW = Date.now();

export const MOCK_USERS = {
  me: { id: 'me', name: 'You' },
  costa: { id: 'u5', name: 'Costa', avatar: 'https://i.pravatar.cc/40?img=12' },
  rachel: { id: 'u6', name: 'Rachel', avatar: 'R' },
  louise: {
    id: 'u2',
    name: 'Louise',
    avatar: 'https://i.pravatar.cc/40?img=32',
  },
  alex: { id: 'u3', name: 'Alex', avatar: 'A' },
  sam: { id: 'u4', name: 'Sam', avatar: 'https://i.pravatar.cc/40?img=48' },
  qa: { id: 'u7', name: 'QA', avatar: '🐞' },
  nina: { id: 'u8', name: 'Nina', avatar: 'N' },
  tom: { id: 'u9', name: 'Tom', avatar: 'https://i.pravatar.cc/40?img=14' },
  mia: { id: 'u10', name: 'Mia', avatar: 'M' },
  viktor: {
    id: 'u11',
    name: 'Viktor',
    avatar: 'https://i.pravatar.cc/40?img=21',
  },
  eva: { id: 'u12', name: 'Eva', avatar: 'E' },
  li: { id: 'u13', name: 'Li', avatar: 'https://i.pravatar.cc/40?img=67' },
};

// ───────────────────────────── DMs ─────────────────────────────

export const DM_CONVERSATIONS = [
  {
    id: 'dm1',
    kind: 'dm',
    title: 'Costa Quinn',
    membersCount: 2,
    preview: 'Yes, you can!',
    lastMessageAt: '1m',
    unread: 0,
    avatar: MOCK_USERS.costa.avatar,
    lastReadAt: MOCK_NOW - 5 * 60 * 1000,
  },
  {
    id: 'dm2',
    kind: 'dm',
    title: 'Rachel Doe',
    membersCount: 2,
    preview: 'Using the static method…',
    lastMessageAt: '14m',
    unread: 3,
    avatar: MOCK_USERS.rachel.avatar,
    lastReadAt: MOCK_NOW - 20 * 60 * 1000,
  },
  {
    id: 'dm3',
    kind: 'dm',
    title: 'Nina Brooks',
    membersCount: 2,
    preview: 'Let’s push it today 💪',
    lastMessageAt: '23m',
    unread: 1,
    avatar: MOCK_USERS.nina.avatar,
    lastReadAt: MOCK_NOW - 60 * 60 * 1000,
  },
  {
    id: 'dm4',
    kind: 'dm',
    title: 'Tom Hill',
    membersCount: 2,
    preview: 'Check PR #142',
    lastMessageAt: '31m',
    unread: 0,
    avatar: MOCK_USERS.tom.avatar,
    lastReadAt: MOCK_NOW - 35 * 60 * 1000,
  },
  {
    id: 'dm5',
    kind: 'dm',
    title: 'Mia Chen',
    membersCount: 2,
    preview: 'Sent the contract.',
    lastMessageAt: '1h',
    unread: 2,
    avatar: MOCK_USERS.mia.avatar,
    lastReadAt: MOCK_NOW - 2 * 60 * 60 * 1000,
  },
  {
    id: 'dm6',
    kind: 'dm',
    title: 'Viktor Green',
    membersCount: 2,
    preview: 'Cool, see you there!',
    lastMessageAt: '3h',
    unread: 0,
    avatar: MOCK_USERS.viktor.avatar,
    lastReadAt: MOCK_NOW - 3.5 * 60 * 60 * 1000,
  },
];

// ───────────────────────────── Channels (Events / Intents) ─────────────────────────────

export const CHANNEL_CONVERSATIONS = [
  {
    id: 'ch1',
    kind: 'channel',
    title: 'Technical issues',
    membersCount: 6,
    preview: 'Great! 👍',
    lastMessageAt: '1m',
    unread: 0,
    avatar: '💻',
    lastReadAt: MOCK_NOW - 10 * 60 * 1000,
  },
  {
    id: 'ch2',
    kind: 'channel',
    title: 'Bugs/Improvements',
    membersCount: 18,
    preview: 'I found a bug…',
    lastMessageAt: '1h',
    unread: 4,
    avatar: '🐞',
    lastReadAt: MOCK_NOW - 2 * 60 * 60 * 1000,
  },
  {
    id: 'ch3',
    kind: 'channel',
    title: 'Design Team',
    membersCount: 9,
    preview: 'Figma frames updated!',
    lastMessageAt: '3h',
    unread: 0,
    avatar: '🎨',
    lastReadAt: MOCK_NOW - 4 * 60 * 60 * 1000,
  },
  {
    id: 'ch4',
    kind: 'channel',
    title: 'Weekend trip',
    membersCount: 12,
    preview: 'See you at 10!',
    lastMessageAt: '6h',
    unread: 2,
    avatar: '⛱️',
    lastReadAt: MOCK_NOW - 7 * 60 * 60 * 1000,
  },
  {
    id: 'ch5',
    kind: 'channel',
    title: 'Marketing ideas',
    membersCount: 15,
    preview: 'Draft post for tomorrow ready.',
    lastMessageAt: '9h',
    unread: 0,
    avatar: '📢',
    lastReadAt: MOCK_NOW - 9.5 * 60 * 60 * 1000,
  },
  {
    id: 'ch6',
    kind: 'channel',
    title: 'Frontend Guild',
    membersCount: 22,
    preview: 'Let’s migrate to Next 15',
    lastMessageAt: '12h',
    unread: 5,
    avatar: '⚡',
    lastReadAt: MOCK_NOW - 14 * 60 * 60 * 1000,
  },
];

// ───────────────────────────── DM messages ─────────────────────────────

export const DM_MESSAGES: Record<string, any[]> = {
  dm1: [
    {
      id: 'dm1-m1',
      text: 'Hey Costa, did you check the docs?',
      at: MOCK_NOW - 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
    {
      id: 'dm1-m2',
      text: 'Yes, you can!',
      at: MOCK_NOW - 59 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.costa,
    },
  ],
  dm2: [
    {
      id: 'dm2-m1',
      text: 'Using the static method might be fine, but prefer DI.',
      at: MOCK_NOW - 25 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.rachel,
    },
    {
      id: 'dm2-m2',
      text: 'Agree, let’s keep it pure.',
      at: MOCK_NOW - 10 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  dm3: [
    {
      id: 'dm3-m1',
      text: 'Morning! Ready for the push?',
      at: MOCK_NOW - 90 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.nina,
    },
    {
      id: 'dm3-m2',
      text: 'Yep, deploying now 🚀',
      at: MOCK_NOW - 85 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  dm4: [
    {
      id: 'dm4-m1',
      text: 'Check PR #142, I added validations.',
      at: MOCK_NOW - 45 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.tom,
    },
    {
      id: 'dm4-m2',
      text: 'Reviewed, looks solid 👍',
      at: MOCK_NOW - 40 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  dm5: [
    {
      id: 'dm5-m1',
      text: 'Sent the contract.',
      at: MOCK_NOW - 2.5 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.mia,
    },
    {
      id: 'dm5-m2',
      text: 'Received, thanks!',
      at: MOCK_NOW - 2.4 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  dm6: [
    {
      id: 'dm6-m1',
      text: 'Cool, see you there!',
      at: MOCK_NOW - 3.5 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.viktor,
    },
    {
      id: 'dm6-m2',
      text: 'Sure thing 👋',
      at: MOCK_NOW - 3.4 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
};

// ───────────────────────────── Channel messages ─────────────────────────────

export const CHANNEL_MESSAGES: Record<string, any[]> = {
  ch1: [
    {
      id: 'ch1-m1',
      text: 'Hello everyone',
      at: MOCK_NOW - 4 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.louise,
    },
    {
      id: 'ch1-m2',
      text: 'Hi Louise!',
      at: MOCK_NOW - 3.9 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
    {
      id: 'ch1-m3',
      text: 'Can we fix the pagination issue today?',
      at: MOCK_NOW - 3.5 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.alex,
    },
    {
      id: 'ch1-m4',
      text: 'Sure, I’ll take it.',
      at: MOCK_NOW - 3.4 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  ch2: [
    {
      id: 'ch2-m1',
      text: 'I found a bug in the save function.',
      at: MOCK_NOW - 2 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.qa,
    },
    {
      id: 'ch2-m2',
      text: 'Steps?',
      at: MOCK_NOW - 1.9 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
    {
      id: 'ch2-m3',
      text: 'Open profile, edit, save → 500.',
      at: MOCK_NOW - 1.8 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.qa,
    },
    {
      id: 'ch2-m4',
      text: 'Got it, patching now.',
      at: MOCK_NOW - 1.7 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  ch3: [
    {
      id: 'ch3-m1',
      text: 'Figma frames updated for mobile layout.',
      at: MOCK_NOW - 3.5 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.eva,
    },
    {
      id: 'ch3-m2',
      text: 'Nice, checking them now.',
      at: MOCK_NOW - 3.4 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  ch4: [
    {
      id: 'ch4-m1',
      text: 'See you all at 10!',
      at: MOCK_NOW - 6.5 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.li,
    },
    {
      id: 'ch4-m2',
      text: 'Bring snacks 😄',
      at: MOCK_NOW - 6.4 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  ch5: [
    {
      id: 'ch5-m1',
      text: 'Draft post for tomorrow ready.',
      at: MOCK_NOW - 9.5 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.mia,
    },
    {
      id: 'ch5-m2',
      text: 'Looks perfect 👌',
      at: MOCK_NOW - 9.4 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
  ch6: [
    {
      id: 'ch6-m1',
      text: 'Let’s migrate to Next 15 soon!',
      at: MOCK_NOW - 12 * 60 * 60 * 1000,
      side: 'left',
      author: MOCK_USERS.viktor,
    },
    {
      id: 'ch6-m2',
      text: 'Yes please, app router cleanup time 🔥',
      at: MOCK_NOW - 11.9 * 60 * 60 * 1000,
      side: 'right',
      author: MOCK_USERS.me,
    },
  ],
};

// ───────────────────────────── Export all ─────────────────────────────

export const MOCK_CHAT_DATA = {
  DM_CONVERSATIONS,
  CHANNEL_CONVERSATIONS,
  DM_MESSAGES,
  CHANNEL_MESSAGES,
};
