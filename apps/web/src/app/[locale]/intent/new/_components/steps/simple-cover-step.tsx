'use client';

import { ImageIcon, Info, Upload, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { toast } from '@/lib/utils';

interface SimpleCoverStepProps {
  coverPreview: string | null;
  isUploading?: boolean;
  onImageSelected: (file: File) => void;
  onImageRemove: () => void;
}

/**
 * SimpleCoverStep - Optional cover image step
 *
 * Features:
 * - Drag & drop upload
 * - Image cropping (21:9 aspect)
 * - Skip option
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Rozmiar obrazka musi być mniejszy niż 10MB');
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
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
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
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Dodaj atrakcyjną okładkę, aby wyróżnić swoje wydarzenie.
        </p>
      </div>

      {/* Preview or Dropzone */}
      {coverPreview ? (
        <div className="space-y-4">
          <div className="relative w-full" style={{ aspectRatio: '21 / 9' }}>
            <img
              src={coverPreview}
              alt="Podgląd okładki"
              className="object-cover w-full h-full border rounded-xl border-zinc-200 dark:border-zinc-700 shadow-sm"
            />
            {!isUploading && (
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute p-2 text-white transition bg-red-600 rounded-full shadow-lg top-2 right-2 hover:bg-red-700"
                title="Usuń okładkę"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-4 border-white rounded-full animate-spin border-t-transparent" />
                  <p className="mt-2 text-sm font-medium text-white">
                    Przesyłanie...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Change/Remove buttons */}
          <div className="flex gap-2">
            <div {...getRootProps()} className="flex-1">
              <input {...getInputProps()} />
              <button
                type="button"
                disabled={isUploading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all"
              >
                <Upload className="w-4 h-4" />
                Zmień okładkę
              </button>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={onImageRemove}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-800/50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
              >
                <X className="w-4 h-4" />
                Usuń
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={[
            'border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer',
            isDragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
            isUploading ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-14 h-14 mx-auto mb-4 text-zinc-400 dark:text-zinc-500" />
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
            {isDragActive
              ? 'Upuść obrazek tutaj'
              : 'Przeciągnij obrazek lub kliknij aby wybrać'}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Zalecane: 1280×549px (proporcje 21:9)
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            PNG, JPG, WEBP do 10MB
          </p>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 dark:text-indigo-100">
          Możesz pominąć ten krok — okładkę dodasz później w panelu wydarzenia.
          Dobra okładka pomaga wyróżnić wydarzenie w wynikach wyszukiwania.
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
