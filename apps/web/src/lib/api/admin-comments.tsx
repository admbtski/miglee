"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "./client";
import {
  AdminCommentsDocument,
  AdminDeleteCommentDocument,
  AdminReviewsDocument,
  AdminDeleteReviewDocument,
} from "./__generated__/react-query-update";

/**
 * Query: Get all comments (admin)
 */
export function useAdminComments(params?: { limit?: number; offset?: number; intentId?: string; userId?: string }) {
  return useQuery({
    queryKey: ["adminComments", params],
    queryFn: async () => {
      return gqlClient.request(AdminCommentsDocument, {
        limit: params?.limit,
        offset: params?.offset,
        intentId: params?.intentId,
        userId: params?.userId,
      });
    },
  });
}

/**
 * Mutation: Delete comment (admin)
 */
export function useAdminDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return gqlClient.request(AdminDeleteCommentDocument, { id });
    },
    onSuccess: () => {
      // Invalidate all admin comments queries
      queryClient.invalidateQueries({ queryKey: ["adminComments"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserComments"] });
      // Also invalidate regular comments queries
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

/**
 * Query: Get all reviews (admin)
 */
export function useAdminReviews(params?: {
  limit?: number;
  offset?: number;
  intentId?: string;
  userId?: string;
  rating?: number;
}) {
  return useQuery({
    queryKey: ["adminReviews", params],
    queryFn: async () => {
      return gqlClient.request(AdminReviewsDocument, {
        limit: params?.limit,
        offset: params?.offset,
        intentId: params?.intentId,
        userId: params?.userId,
        rating: params?.rating,
      });
    },
  });
}

/**
 * Mutation: Delete review (admin)
 */
export function useAdminDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return gqlClient.request(AdminDeleteReviewDocument, { id });
    },
    onSuccess: () => {
      // Invalidate all admin reviews queries
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
      queryClient.invalidateQueries({ queryKey: ["adminUserReviews"] });
      // Also invalidate regular reviews queries
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
