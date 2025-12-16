import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import {
  GetUploadUrlDocument,
  ConfirmMediaUploadDocument,
  MediaPurpose,
  type GetUploadUrlMutation,
  type GetUploadUrlMutationVariables,
  type ConfirmMediaUploadMutation,
  type ConfirmMediaUploadMutationVariables,
} from '@/lib/api/__generated__/react-query-update';

export interface UseMediaUploadOptions {
  purpose: MediaPurpose;
  entityId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useMediaUpload(options: UseMediaUploadOptions) {
  const { purpose, entityId, onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await gqlClient.request<
        GetUploadUrlMutation,
        GetUploadUrlMutationVariables
      >(GetUploadUrlDocument, {
        purpose,
        entityId: entityId!,
      });

      const { uploadUrl, uploadKey, provider } = uploadUrlResponse.getUploadUrl;

      // Step 2: Upload file
      if (provider === 'S3') {
        // S3: PUT request with presigned URL
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
      } else {
        // LOCAL: POST request to local endpoint
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
      }

      setUploadProgress(100);

      // Step 3: Confirm upload
      await gqlClient.request<
        ConfirmMediaUploadMutation,
        ConfirmMediaUploadMutationVariables
      >(ConfirmMediaUploadDocument, {
        purpose,
        entityId: entityId!,
        uploadKey,
      });

      return { uploadKey };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      switch (purpose) {
        case MediaPurpose.UserAvatar:
        case MediaPurpose.UserCover:
          queryClient.invalidateQueries({ queryKey: ['Me'] });
          queryClient.invalidateQueries({ queryKey: ['GetMyFullProfile'] });
          queryClient.invalidateQueries({ queryKey: ['GetUser'] });
          break;
        case MediaPurpose.EventCover:
          queryClient.invalidateQueries({
            queryKey: ['GetEventDetail', entityId],
          });
          queryClient.invalidateQueries({ queryKey: ['GetEvents'] });
          queryClient.invalidateQueries({ queryKey: ['GetEventsInfinite'] });
          break;
      }

      setUploadProgress(0);
      onSuccess?.();
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      onError?.(error);
    },
  });

  return {
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    uploadProgress,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}

/**
 * Hook for uploading user avatar
 */
export function useAvatarUpload(
  userId: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  return useMediaUpload({
    purpose: MediaPurpose.UserAvatar,
    entityId: userId,
    ...options,
  });
}

/**
 * Hook for uploading user cover
 */
export function useCoverUpload(
  userId: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  return useMediaUpload({
    purpose: MediaPurpose.UserCover,
    entityId: userId,
    ...options,
  });
}

/**
 * Hook for uploading event cover
 */
export function useEventCoverUpload(
  eventId: string,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  return useMediaUpload({
    purpose: MediaPurpose.EventCover,
    entityId: eventId,
    ...options,
  });
}
