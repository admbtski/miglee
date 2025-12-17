'use client';

// TODO i18n: Polish strings need translation

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, Sparkles, Upload, X } from 'lucide-react';

import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { cn, toast } from '@/lib/utils';

interface SimpleCoverStepProps {
  coverPreview: string | null;
  isUploading?: boolean;
  onImageSelected: (file: File) => void;
  onImageRemove: () => void;
}

const MAX_SIZE_MB = 10;

/**
 * SimpleCoverStep - Optional cover image step for event creator
 *
 * Features:
 * - Drag & drop upload
 * - Image cropping (21:9 aspect)
 * - Skip option with helpful messaging
 */
export function SimpleCoverStep({
  coverPreview,
  isUploading = false,
  onImageSelected,
  onImageRemove,
}: SimpleCoverStepProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Wybierz plik obrazka');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Rozmiar obrazka musi być mniejszy niż ${MAX_SIZE_MB}MB`);
      return;
    }

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
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    disabled: isUploading,
    noClick: false,
    noKeyboard: false,
  });

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      const file = new File([croppedBlob], 'cover.webp', {
        type: 'image/webp',
      });
      onImageSelected(file);
      setCropModalOpen(false);
      setSelectedImageSrc(null);
    } catch (error) {
      console.error('Failed to process cropped image:', error);
      toast.error('Nie udało się przetworzyć obrazka. Spróbuj ponownie.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Okładka wydarzenia
        </h3>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          Dodaj atrakcyjną okładkę, aby wyróżnić swoje wydarzenie.
        </p>
      </div>

      {/* Preview or Dropzone */}
      {coverPreview ? (
        <div className="space-y-4">
          {/* Image Preview */}
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
            style={{ aspectRatio: '21 / 9' }}
          >
            <img
              src={coverPreview}
              alt="Podgląd okładki"
              className="object-cover w-full h-full"
            />

            {/* Remove button */}
            {!isUploading && (
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm shadow-lg"
                title="Usuń okładkę"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Uploading overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <div className="inline-block w-10 h-10 border-4 border-white/30 rounded-full animate-spin border-t-white" />
                  <p className="mt-3 text-sm font-medium text-white">
                    Przesyłanie...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <div {...getRootProps()} className="flex-1">
              <input {...getInputProps()} />
              <button
                type="button"
                disabled={isUploading}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  'border border-zinc-200 dark:border-zinc-700',
                  'bg-white dark:bg-zinc-800/50',
                  'text-zinc-700 dark:text-zinc-300',
                  'hover:bg-zinc-50 dark:hover:bg-zinc-800',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Upload className="w-4 h-4" />
                Zmień okładkę
              </button>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={onImageRemove}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  'border border-red-200 dark:border-red-800/50',
                  'bg-white dark:bg-zinc-800/50',
                  'text-red-600 dark:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-900/20'
                )}
              >
                <X className="w-4 h-4" />
                Usuń
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Dropzone */
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
            isDragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30',
            !isDragActive &&
              'hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
          style={{ aspectRatio: '21 / 9' }}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                isDragActive
                  ? 'bg-indigo-100 dark:bg-indigo-900/40'
                  : 'bg-zinc-100 dark:bg-zinc-800'
              )}
            >
              {isDragActive ? (
                <Upload className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
              ) : (
                <ImageIcon className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
              )}
            </div>

            <div>
              <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">
                {isDragActive
                  ? 'Upuść obrazek tutaj'
                  : 'Przeciągnij obrazek lub kliknij'}
              </p>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Zalecane: 1280×549px (21:9)
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                PNG, JPG, WEBP do {MAX_SIZE_MB}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info note - skip message */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50">
        <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">
          <strong className="font-medium">Możesz pominąć ten krok</strong> —
          okładkę dodasz później w panelu wydarzenia. Dobra okładka pomaga
          wyróżnić wydarzenie w wynikach wyszukiwania.
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
          aspect={21 / 9}
          onCropComplete={handleCropComplete}
          title="Przytnij okładkę"
          isUploading={false}
        />
      )}
    </div>
  );
}
