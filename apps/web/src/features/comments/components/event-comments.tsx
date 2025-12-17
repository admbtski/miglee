'use client';

import { Avatar } from '@/components/ui/avatar';
import { useMeQuery } from '@/features/auth';
import {
  useCreateComment,
  useDeleteComment,
  useGetComments,
  useHideComment,
  useUpdateComment,
} from '@/features/comments';
import type { EventDetailsData } from '@/features/events/types/event-details';
import { ReportCommentModal } from '@/features/reports';
import { buildAvatarUrl } from '@/lib/media/url';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  EyeOff,
  Flag,
  Loader2,
  MessageSquare,
  MoreVertical,
  Reply,
  Send,
  Shield,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type EventCommentsProps = {
  event: EventDetailsData;
};

type CommentItemProps = {
  comment: any;
  eventId: string;
  currentUserId?: string;
  isAppAdmin?: boolean;
  isAppModerator?: boolean;
  isEventOwnerOrMod?: boolean;
  isReply?: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onHide: (id: string) => void;
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
  isAppAdmin = false,
  isAppModerator = false,
  isEventOwnerOrMod = false,
  isReply = false,
  onEdit,
  onDelete,
  onHide,
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
  const isDeleted = Boolean(comment.deletedAt);
  const isHidden = Boolean(comment.hiddenAt);
  const isRemovedFromView = isDeleted || isHidden;

  // Permissions matrix:
  // - Edit: Only App Admin or Comment Author (App Moderator and Event Owner/Mod should use hide/delete)
  // - Delete: App Admin, App Moderator, Event Owner/Mod, or Comment Author
  // - Hide: App Admin, App Moderator, or Event Owner/Mod (not author unless they are also mod)
  // - Report: Any logged in user except the author
  const canEdit = isAppAdmin || isAuthor;
  const canDelete =
    isAppAdmin || isAppModerator || isEventOwnerOrMod || isAuthor;
  const canHide =
    (isAppAdmin || isAppModerator || isEventOwnerOrMod) && !isHidden;
  const canReport = Boolean(currentUserId) && !isAuthor;
  const showModerationBadge =
    (isAppAdmin || isAppModerator || isEventOwnerOrMod) && isRemovedFromView;

  // Fetch replies when expanded - hooks are now at the top level of this component
  const repliesQuery = useGetComments(
    {
      eventId: eventId,
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
          eventId: eventId,
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
      className={`${isReply ? 'ml-8 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800' : ''}`}
    >
      <div className="p-4 bg-white rounded-lg shadow-sm group dark:bg-zinc-900">
        {/* Deleted/Hidden Comment Placeholder */}
        {isRemovedFromView && !showModerationBadge ? (
          <div className="flex items-center gap-3 py-6 text-sm text-zinc-500 dark:text-zinc-400">
            <EyeOff className="w-4 h-4" />
            <span className="italic">
              {isDeleted
                ? 'Ten komentarz został usunięty'
                : 'Ten komentarz został ukryty'}
            </span>
          </div>
        ) : (
          <>
            {/* Moderation Badge for deleted/hidden comments visible to moderators */}
            {isRemovedFromView && showModerationBadge && (
              <div className="flex items-center gap-2 px-3 py-2 mb-3 text-xs font-medium border rounded-lg bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                <Shield className="w-4 h-4" />
                <span>
                  {isDeleted ? 'Komentarz usunięty' : 'Komentarz ukryty'}
                  {comment.deletedBy && ` przez ${comment.deletedBy.name}`}
                  {comment.hiddenBy && ` przez ${comment.hiddenBy.name}`}
                </span>
                <span className="ml-auto text-red-600 dark:text-red-400">
                  (widoczny dla moderatorów)
                </span>
              </div>
            )}

            {/* Author & Actions */}
            <div className="flex items-start justify-between mb-2">
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
                      className="transition-opacity rounded-full hover:opacity-80"
                    />
                  </Link>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/u/${comment.author?.name}`}
                    className="text-sm font-medium transition-colors text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                  >
                    {(comment.author as any)?.profile?.displayName ||
                      comment.author?.name ||
                      'N/A'}
                  </Link>
                  <Link
                    href={`/u/${comment.author?.name}`}
                    className="block text-xs transition-colors text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                  >
                    @{comment.author?.name || 'N/A'}
                  </Link>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
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
                <div className="relative transition-opacity opacity-0 group-hover:opacity-100">
                  <div className="relative group/menu">
                    <button className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <MoreVertical className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <div className="absolute right-0 z-10 w-48 py-1 mt-1 transition-transform origin-top-right scale-0 bg-white rounded-md shadow-lg ring-1 ring-zinc-200 group-hover/menu:scale-100 dark:bg-zinc-800 dark:ring-zinc-700">
                      {canEdit && (
                        <button
                          onClick={() => onEdit(comment.id, comment.content)}
                          className="flex items-center w-full gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edytuj
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(comment.id)}
                          className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isAuthor ? 'Usuń' : 'Usuń (moderacja)'}
                        </button>
                      )}
                      {canHide && !isDeleted && (
                        <button
                          onClick={() => onHide(comment.id)}
                          className="flex items-center w-full gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-zinc-100 dark:text-amber-400 dark:hover:bg-zinc-700"
                        >
                          <Shield className="w-4 h-4" />
                          Ukryj komentarz
                        </button>
                      )}
                      {canReport && (
                        <button
                          onClick={() =>
                            onReport(comment.id, comment.author?.name || 'N/A')
                          }
                          className="flex items-center w-full gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          <Flag className="w-4 h-4" />
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
                  className="w-full px-3 py-2 text-sm border rounded-lg border-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-3">
                  {currentUserId && !isReply && (
                    <button
                      onClick={() => onReply(comment.id)}
                      className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      <Reply className="w-3 h-3" />
                      Odpowiedz
                    </button>
                  )}
                  {hasReplies && (
                    <button
                      onClick={() => onToggleThread(comment.id)}
                      disabled={isLoadingReplies}
                      className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      {isLoadingReplies ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Ładowanie...
                        </>
                      ) : isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Ukryj odpowiedzi ({comment.repliesCount})
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Pokaż odpowiedzi ({comment.repliesCount})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="mt-3 ml-8">
          <div className="p-3 bg-white border rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Napisz odpowiedź..."
              className="w-full px-3 py-2 text-sm border rounded-lg border-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
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
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
              isAppAdmin={isAppAdmin}
              isAppModerator={isAppModerator}
              isEventOwnerOrMod={isEventOwnerOrMod}
              isReply={true}
              onEdit={onEdit}
              onDelete={onDelete}
              onHide={onHide}
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
  const userRole = authData?.me?.role;

  // Check permissions hierarchy
  const isAppAdmin = userRole === 'ADMIN';
  const isAppModerator = userRole === 'MODERATOR';
  const isEventOwnerOrMod = useMemo(() => {
    if (!currentUserId || !event.userMembership) return false;
    return event.userMembership.isOwner || event.userMembership.isModerator;
  }, [currentUserId, event.userMembership]);

  // Permissions:
  // - App Admin/Moderator: can edit, delete, hide, report any comment
  // - Event Owner/Moderator: can delete, hide, report (not edit) others' comments
  // - Comment Author: can edit and delete own comments
  // - Any logged user: can report comments

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
    eventId: event.id,
    limit: 100,
    parentId: null, // Only fetch top-level comments
  });

  // Mutations
  const createMutation = useCreateComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();
  const hideMutation = useHideComment();

  const topLevelComments = commentsData?.comments?.items ?? [];

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    try {
      await createMutation.mutateAsync({
        input: {
          eventId: event.id,
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

  const handleHideComment = async (id: string) => {
    if (
      !confirm(
        'Czy na pewno chcesz ukryć ten komentarz? Będzie on widoczny tylko dla moderatorów.'
      )
    )
      return;

    try {
      await hideMutation.mutateAsync({ id });
    } catch (error) {
      console.error('Failed to hide comment:', error);
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
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Komentarze
        </h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
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
            className="w-full px-4 py-3 text-sm border rounded-lg border-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !newComment.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Wyślij komentarz
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 mb-6 text-center border rounded-lg border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Zaloguj się, aby dodać komentarz
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin dark:text-blue-400" />
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
              isAppAdmin={isAppAdmin}
              isAppModerator={isAppModerator}
              isEventOwnerOrMod={isEventOwnerOrMod}
              onEdit={handleEdit}
              onDelete={handleDeleteComment}
              onHide={handleHideComment}
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
