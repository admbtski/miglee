'use client';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
  reacted: boolean;
}

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReactionClick: (emoji: string) => void;
  align?: 'left' | 'right';
}

export function MessageReactions({
  reactions,
  onReactionClick,
  align = 'left',
}: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  const handleReactionClick = (emoji: string) => {
    onReactionClick(emoji);
  };

  const getTooltip = (reaction: MessageReaction) => {
    if (reaction.count === 1) {
      return reaction.users[0]?.name || 'Someone';
    }
    if (reaction.count === 2) {
      return `${reaction.users[0]?.name} and ${reaction.users[1]?.name}`;
    }
    return `${reaction.users[0]?.name}, ${reaction.users[1]?.name}, and ${
      reaction.count - 2
    } others`;
  };

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji)}
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all duration-200 transform hover:scale-110 active:scale-95 ${
            reaction.reacted
              ? 'bg-[#4A45FF]/10 ring-1 ring-[#4A45FF]/30'
              : 'bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700'
          } shadow-sm`}
          title={getTooltip(reaction)}
          aria-label={`${reaction.emoji} ${reaction.count}`}
        >
          <span className="text-sm leading-none">{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className="font-medium text-[10px] leading-none text-zinc-700 dark:text-zinc-300">
              {reaction.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
