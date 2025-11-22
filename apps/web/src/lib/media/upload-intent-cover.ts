import { gqlClient } from '../api/client';
import {
  GetUploadUrlDocument,
  ConfirmMediaUploadDocument,
  MediaPurpose,
} from '../api/__generated__/react-query-update';

/**
 * Upload cover image for Intent
 * @param intentId - ID of the Intent
 * @param file - Image file (after crop)
 * @param callbacks - Optional callbacks for upload lifecycle
 * @returns Promise<{ mediaKey: string; mediaAssetId: string }>
 */
export async function uploadIntentCover(
  intentId: string,
  file: File,
  callbacks?: {
    onStart?: () => void;
    onSuccess?: (result: { mediaKey: string; mediaAssetId: string }) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
  }
): Promise<{ mediaKey: string; mediaAssetId: string }> {
  try {
    callbacks?.onStart?.();

    const uploadUrlResponse = await gqlClient.request(GetUploadUrlDocument, {
      purpose: MediaPurpose.IntentCover,
      entityId: intentId,
    });

    const { uploadUrl, uploadKey, provider } = uploadUrlResponse.getUploadUrl;

    if (provider === 'S3') {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
    } else {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
    }

    const confirmResponse = await gqlClient.request(
      ConfirmMediaUploadDocument,
      {
        purpose: MediaPurpose.IntentCover,
        entityId: intentId,
        uploadKey,
      }
    );

    const result = {
      mediaKey: confirmResponse.confirmMediaUpload.mediaKey,
      mediaAssetId: confirmResponse.confirmMediaUpload.mediaAssetId,
    };

    callbacks?.onSuccess?.(result);

    return result;
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error('Unknown upload error');
    callbacks?.onError?.(err);
    throw err;
  } finally {
    callbacks?.onFinally?.();
  }
}
