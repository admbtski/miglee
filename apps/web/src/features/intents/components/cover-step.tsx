'use client';

import { ImageIcon, X, Upload } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { toast } from '@/lib/utils';

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

  const processFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]!);
      }
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxFiles: 1,
    disabled: isUploading,
    noClick: false,
    noKeyboard: false,
  });

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
    } catch (error) {
      console.error('Failed to process cropped image:', error);
      toast.error('Failed to process image. Please try again.');
    }
  };

  const handleRemove = () => {
    onImageRemove();
  };

  return (
    <div className="space-y-4">
      {/* Preview or Dropzone */}
      {coverPreview ? (
        <div className="relative w-full" style={{ aspectRatio: '21 / 9' }}>
          <img
            src={coverPreview}
            alt="Podgląd okładki"
            className="object-cover w-full h-full border rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute p-2 text-white transition bg-red-600 rounded-full shadow-lg top-2 right-2 hover:bg-red-700"
              title="Remove cover image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-white rounded-full animate-spin border-t-transparent" />
                <p className="mt-2 text-sm font-medium text-white">
                  Uploading...
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-900/70'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-zinc-400 dark:text-zinc-500" />
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {isDragActive
              ? 'Upuść obrazek tutaj'
              : 'Przeciągnij i upuść obrazek lub kliknij aby wybrać'}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Zalecane: 1280x549px (proporcje 21:9)
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            PNG, JPG, WEBP do 10MB
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {coverPreview && (
        <div className="flex gap-2">
          <div {...getRootProps()} className="flex-1">
            <input {...getInputProps()} />
            <button
              type="button"
              disabled={isUploading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Zmień okładkę
            </button>
          </div>

          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20 transition-all shadow-sm"
            >
              <X className="w-4 h-4" />
              Usuń
            </button>
          )}
        </div>
      )}

      {/* Info Text */}
      <div className="p-4 border rounded-2xl border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
          <strong className="font-semibold">Wskazówka:</strong> Dobry obraz
          okładki pomaga wyróżnić Twoje wydarzenie. Wybierz zdjęcie, które
          reprezentuje aktywność lub lokalizację.
        </p>
      </div>

      {/* Crop Modal */}
      {selectedImageSrc && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setSelectedImageSrc(null);
          }}
          imageSrc={selectedImageSrc}
          aspect={21 / 9} // 21:9 for cover
          onCropComplete={handleCropComplete}
          title="Crop Cover Image"
          isUploading={false}
        />
      )}
    </div>
  );
}
