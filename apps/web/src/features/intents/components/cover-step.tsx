'use client';

import { ImageIcon, X, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { ImageCropModal } from '@/components/ui/image-crop-modal';

interface CoverStepProps {
  /** Current cover image preview (base64 or URL) */
  coverPreview: string | null;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Called when user selects and crops an image */
  onImageSelected: (file: File) => void;
  /** Called when user removes the image */
  onImageRemove: () => void;
}

export function CoverStep({
  coverPreview,
  isUploading = false,
  onImageSelected,
  onImageRemove,
}: CoverStepProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Convert blob to File
      const file = new File([croppedBlob], 'cover.webp', {
        type: 'image/webp',
      });

      // Call parent handler
      onImageSelected(file);

      // Close modal and reset
      setCropModalOpen(false);
      setSelectedImageSrc(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to process cropped image:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  const handleRemove = () => {
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview or Placeholder */}
      {coverPreview ? (
        <div className="relative">
          <img
            src={coverPreview}
            alt="Cover preview"
            className="w-full h-64 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
              title="Remove cover image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <p className="mt-2 text-sm font-medium text-white">
                  Uploading...
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-12 text-center bg-zinc-50 dark:bg-zinc-900/50">
          <ImageIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            No cover image selected
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Recommended: 1280x720px (16:9 aspect ratio)
          </p>
        </div>
      )}

      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
        >
          <Upload className="h-4 w-4" />
          {coverPreview ? 'Change Cover' : 'Upload Cover'}
        </button>

        {coverPreview && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20 transition"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>

      {/* Info Text */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <strong>Tip:</strong> A good cover image helps your event stand out.
          Choose an image that represents the activity or location.
        </p>
      </div>

      {/* Crop Modal */}
      {selectedImageSrc && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setSelectedImageSrc(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          imageSrc={selectedImageSrc}
          aspect={16 / 9} // 16:9 for cover
          onCropComplete={handleCropComplete}
          title="Crop Cover Image"
          isUploading={false}
        />
      )}
    </div>
  );
}
