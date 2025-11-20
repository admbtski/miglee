'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useGetComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '@/lib/api/comments';
import { useMeQuery } from '@/lib/api/auth';
import {
  MessageSquare,
  Send,
  Loader2,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  ChevronDown,
  ChevronUp,
  Flag,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ReportCommentModal } from './report-comment-modal';
import type { EventDetailsData } from '@/types/event-details';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';

type EventCommentsProps = {
  event: EventDetailsData;
};

type CommentItemProps = {
  comment: any;
  eventId: string;
  currentUserId?: string;
  isReply?: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string) => void;
  onReport: (commentId: string, authorName: string) => void;
  onToggleThread: (commentId: string) => void;
  editingId: string | null;
  editingContent: string;
  setEditingContent: (content: string) => void;
  replyingTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  expandedThreads: Set<string>;
  updateMutation: any;
  createMutation: any;
};

function CommentItem({
  comment,
  eventId,
  currentUserId,
  isReply = false,
  onEdit,
  onDelete,
  onReply,
  onReport,
  onToggleThread,
  editingId,
  editingContent,
  setEditingContent,
  replyingTo,
  replyContent,
  setReplyContent,
  expandedThreads,
  updateMutation,
  createMutation,
}: CommentItemProps) {
  const isAuthor = comment.authorId === currentUserId;
  const isEditing = editingId === comment.id;
  const hasReplies = comment.repliesCount > 0;
  const isExpanded = expandedThreads.has(comment.id);

  // Fetch replies when expanded - hooks are now at the top level of this component
  const repliesQuery = useGetComments(
    {
      intentId: eventId,
      parentId: comment.id,
      limit: 100,
    },
    {
      enabled: isExpanded && hasReplies,
    }
  );

  const replies = repliesQuery.data?.comments?.items ?? [];
  const isLoadingReplies = repliesQuery.isLoading && isExpanded;

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !currentUserId) return;

    try {
      await createMutation.mutateAsync({
        input: {
          intentId: eventId,
          content: replyContent.trim(),
          parentId: comment.id,
        },
      });
      setReplyContent('');
      onReply(''); // Close reply form

      // Ensure the thread is expanded to show the new reply
      if (!isExpanded) {
        onToggleThread(comment.id);
      } else {
        // If already expanded, refetch replies to show the new one immediately
        repliesQuery.refetch();
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  return (
    <div
      key={comment.id}
      className={`${isReply ? 'ml-8 border-l-2 border-neutral-200 pl-4 dark:border-neutral-800' : ''}`}
    >
      <div className="group rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-900">
        {/* Author & Actions */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {comment.author?.avatarKey && (
              <Link
                href={`/u/${comment.author.name}`}
                className="flex-shrink-0"
              >
                <Avatar
                  url={buildAvatarUrl(comment.author.avatarKey, 'xs')}
                  blurhash={comment.author.avatarBlurhash}
                  alt={
                    (comment.author as any).profile?.displayName ||
                    comment.author.name
                  }
                  size={32}
                  className="rounded-full transition-opacity hover:opacity-80"
                />
              </Link>
            )}
            <div className="min-w-0">
              <Link
                href={`/u/${comment.author?.name}`}
                className="text-sm font-medium text-neutral-900 transition-colors hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
              >
                {(comment.author as any)?.profile?.displayName ||
                  comment.author?.name ||
                  'N/A'}
              </Link>
              <Link
                href={`/u/${comment.author?.name}`}
                className="block text-xs text-neutral-600 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
              >
                @{comment.author?.name || 'N/A'}
              </Link>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', {
                  locale: pl,
                })}
                {comment.updatedAt !== comment.createdAt && (
                  <span className="ml-1">(edytowano)</span>
                )}
              </p>
            </div>
          </div>

          {currentUserId && !isEditing && (
            <div className="relative opacity-0 transition-opacity group-hover:opacity-100">
              <div className="group/menu relative">
                <button className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <MoreVertical className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <div className="absolute right-0 z-10 mt-1 w-40 origin-top-right scale-0 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition-transform group-hover/menu:scale-100 dark:bg-neutral-800">
                  {isAuthor ? (
                    <>
                      <button
                        onClick={() => onEdit(comment.id, comment.content)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edytuj
                      </button>
                      <button
                        onClick={() => onDelete(comment.id)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Usuń
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        onReport(comment.id, comment.author?.name || 'N/A')
                      }
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      <Flag className="h-4 w-4" />
                      Zgłoś
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!editingContent.trim()) return;
                  updateMutation.mutate({
                    id: comment.id,
                    input: { content: editingContent.trim() },
                  });
                }}
                disabled={updateMutation.isPending}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                onClick={() => onEdit('', '')}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-4">
              {currentUserId && !isReply && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  <Reply className="h-3 w-3" />
                  Odpowiedz
                </button>
              )}
              {hasReplies && (
                <button
                  onClick={() => onToggleThread(comment.id)}
                  disabled={isLoadingReplies}
                  className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  {isLoadingReplies ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Ładowanie...
                    </>
                  ) : isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Ukryj odpowiedzi ({comment.repliesCount})
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Pokaż odpowiedzi ({comment.repliesCount})
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-3">
          <div className="rounded-lg border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Napisz odpowiedź..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              rows={3}
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleSubmitReply}
                disabled={createMutation.isPending || !replyContent.trim()}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Wysyłanie...' : 'Odpowiedz'}
              </button>
              <button
                onClick={() => {
                  onReply('');
                  setReplyContent('');
                }}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {hasReplies && isExpanded && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              eventId={eventId}
              currentUserId={currentUserId}
              isReply={true}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              onReport={onReport}
              onToggleThread={onToggleThread}
              editingId={editingId}
              editingContent={editingContent}
              setEditingContent={setEditingContent}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              expandedThreads={expandedThreads}
              updateMutation={updateMutation}
              createMutation={createMutation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EventComments({ event }: EventCommentsProps) {
  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    new Set()
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [commentToReport, setCommentToReport] = useState<{
    id: string;
    authorName: string;
  } | null>(null);

  // Query for top-level comments only
  const { data: commentsData, isLoading } = useGetComments({
    intentId: event.id,
    limit: 100,
    parentId: null, // Only fetch top-level comments
  });

  // Mutations
  const createMutation = useCreateComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();

  const topLevelComments = commentsData?.comments?.items ?? [];

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    try {
      await createMutation.mutateAsync({
        input: {
          intentId: event.id,
          content: newComment.trim(),
        },
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleEdit = (id: string, content: string) => {
    if (id === '') {
      // Cancel editing
      setEditingId(null);
      setEditingContent('');
    } else {
      // Start editing
      setEditingId(id);
      setEditingContent(content);
    }
  };

  const handleReply = (parentId: string) => {
    if (parentId === '') {
      // Cancel reply
      setReplyingTo(null);
    } else {
      // Start reply
      setReplyingTo(parentId);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;

    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReportComment = (commentId: string, authorName: string) => {
    setCommentToReport({ id: commentId, authorName });
    setReportModalOpen(true);
  };

  const toggleThread = (commentId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Komentarze
        </h2>
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          ({event.commentsCount})
        </span>
      </div>

      {/* New Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Dodaj komentarz..."
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !newComment.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Wyślij komentarz
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Zaloguj się, aby dodać komentarz
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700" />
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Brak komentarzy. Bądź pierwszy!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              eventId={event.id}
              currentUserId={currentUserId}
              onEdit={handleEdit}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              onReport={handleReportComment}
              onToggleThread={toggleThread}
              editingId={editingId}
              editingContent={editingContent}
              setEditingContent={setEditingContent}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              expandedThreads={expandedThreads}
              updateMutation={updateMutation}
              createMutation={createMutation}
            />
          ))}
        </div>
      )}

      {/* Report Comment Modal */}
      {commentToReport && (
        <ReportCommentModal
          open={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setCommentToReport(null);
          }}
          commentId={commentToReport.id}
          commentAuthor={commentToReport.authorName}
        />
      )}
    </div>
  );
}
