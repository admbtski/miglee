'use client';

import { useState, useEffect } from 'react';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { ManagementPageLayout } from '../../_components/management-page-layout';
import { CoverStep } from '@/features/intents/components/cover-step';
import { useIntentCoverUpload } from '@/lib/media/use-media-upload';
import { buildIntentCoverUrl } from '@/lib/media/url';
import { useIntentQuery } from '@/lib/api/intents';
import { toast } from '@/lib/utils';

/**
 * Cover step - Event cover image
 */
export default function CoverStepPage() {
  const { intentId } = useIntentEdit();
  const { data: intentData } = useIntentQuery({ id: intentId });
  const intent = intentData?.intent;

  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Update preview when intent data loads
  useEffect(() => {
    if (intent?.coverKey) {
      setCoverPreview(buildIntentCoverUrl(intent.coverKey, 'card'));
    }
  }, [intent?.coverKey]);

  const coverUpload = useIntentCoverUpload(intentId, {
    onSuccess: () => {
      toast.success('Cover image updated successfully!');
    },
    onError: (error) => {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover: ' + error.message);
    },
  });

  const handleImageSelected = async (file: File) => {
    console.log('handleImageSelected called with file:', file.name);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      console.log('Preview created');
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      console.log('Starting upload...');
      await coverUpload.uploadAsync(file);
      console.log('Upload successful');
    } catch (error) {
      // Error is handled by onError callback
      console.error('Upload failed:', error);
    }
  };

  const handleImageRemove = () => {
    console.log('handleImageRemove called');
    setCoverPreview(null);
    // TODO: Add mutation to remove cover image
    toast.info('Cover image removed (backend support pending)');
  };

  return (
    <ManagementPageLayout
      title="Cover Image"
      description="Upload a cover image for your event"
    >
      <CoverStep
        coverPreview={coverPreview}
        isUploading={coverUpload.isUploading}
        onImageSelected={handleImageSelected}
        onImageRemove={handleImageRemove}
      />
    </ManagementPageLayout>
  );
}
