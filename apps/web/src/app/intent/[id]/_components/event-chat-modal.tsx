'use client';

import { Modal } from '@/components/feedback/modal';
import { X, Send, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  useGetIntentMessages,
  useSendIntentMessage,
} from '@/lib/api/event-chat';
import { useIntentMessageAdded } from '@/lib/api/event-chat-subscriptions';
import { useQueryClient } from '@tanstack/react-query';
import { eventChatKeys } from '@/lib/api/event-chat';
import { useMeQuery } from '@/lib/api/auth';

type EventChatModalProps = {
  open: boolean;
  onClose: () => void;
  intentId: string;
  intentTitle: string;
};

export function EventChatModal({
  open,
  onClose,
  intentId,
  intentTitle,
}: EventChatModalProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get current user
  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;

  // Fetch messages (infinite query)
  const { data: messagesData, isLoading } = useGetIntentMessages(intentId, {
    enabled: open,
  });

  // Send message mutation
  const sendMessage = useSendIntentMessage();

  // Subscribe to new messages
  useIntentMessageAdded({
    intentId,
    enabled: open,
    onMessage: () => {
      // Invalidate to refetch messages
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.messages(intentId),
      });
    },
  });

  // Extract messages from pages
  const messages =
    messagesData?.pages?.flatMap((page) => page.intentMessages.items) ?? [];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || sendMessage.isPending) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await sendMessage.mutateAsync({
        input: {
          intentId,
          content: text,
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessageText(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Czat wydarzenia
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {intentTitle}
        </p>
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const content = (
    <div className="flex h-[500px] flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Brak wiadomości
            </p>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              Rozpocznij rozmowę!
            </p>
          </div>
        )}

        {messages.map((message: any) => {
          const isOwn = message.sender?.id === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                }`}
              >
                {!isOwn && (
                  <p className="mb-1 text-xs font-medium opacity-70">
                    {message.sender?.name ?? 'Unknown'}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    isOwn
                      ? 'text-blue-100'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napisz wiadomość..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            className="flex h-auto items-center justify-center rounded-xl bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Naciśnij Enter aby wysłać, Shift+Enter dla nowej linii
        </p>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      density="compact"
      header={header}
      content={content}
    />
  );
}
