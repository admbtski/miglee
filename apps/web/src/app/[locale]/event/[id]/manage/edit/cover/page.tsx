'use client';

/**
 * Cover Image Section
 * Features: Upload, drag & drop, image cropping, fallback cover info
 */

// TODO i18n: Polish strings need translation

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Sparkles, Upload, X } from 'lucide-react';

import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { uploadEventCover } from '@/lib/media/upload-event-cover';
import { buildEventCoverUrl } from '@/lib/media/url';
import { cn, toast } from '@/lib/utils';

import { useEdit } from '../_components/edit-provider';
import { EditSection, InfoBox } from '../_components/edit-section';

const MAX_SIZE_MB = 10;

export default function CoverPage() {
  const { event, eventId, isLoading, refetch } = useEdit();
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  // Current cover URL
  const currentCover = event?.coverKey
    ? buildEventCoverUrl(event.coverKey, 'detail')
    : null;

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

      setSelectedFile(file);
      setIsDirty(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      setCropModalOpen(false);
      setSelectedImageSrc(null);
    } catch (error) {
      console.error('Failed to process cropped image:', error);
      toast.error('Nie udało się przetworzyć obrazka. Spróbuj ponownie.');
    }
  };

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDirty(false);
  }, []);

  const handleSave = async () => {
    if (!selectedFile) return false;

    try {
      await uploadEventCover(eventId, selectedFile, {
        onStart: () => setIsUploading(true),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['GetEventDetail', eventId],
          });
          queryClient.invalidateQueries({ queryKey: ['GetEventDetail'] });
          setSelectedFile(null);
          setPreviewUrl(null);
          setIsDirty(false);
          refetch();
          toast.success('Okładka została przesłana');
        },
        onError: (error) => {
          console.error('Cover upload failed:', error);
          toast.error('Nie udało się przesłać okładki');
        },
        onFinally: () => setIsUploading(false),
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const displayImage = previewUrl || currentCover;

  return (
    <EditSection
      title="Okładka wydarzenia"
      description="Dodaj atrakcyjny baner dla swojego wydarzenia"
      onSave={handleSave}
      isDirty={isDirty}
      isLoading={isLoading}
    >
      {/* Preview or Dropzone */}
      {displayImage ? (
        <div className="space-y-4">
          {/* Image Preview */}
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
            style={{ aspectRatio: '21 / 9' }}
          >
            <img
              src={displayImage}
              alt="Podgląd okładki"
              className="object-cover w-full h-full"
            />

            {/* Remove button */}
            {!isUploading && previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
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

            {!isUploading && previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  'border border-red-200 dark:border-red-800/50',
                  'bg-white dark:bg-zinc-800/50',
                  'text-red-600 dark:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-900/20'
                )}
              >
                <X className="w-4 h-4" />
                Anuluj
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

      {/* Info tip */}
      <InfoBox>
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong className="font-medium">Brak zdjęcia?</strong> Wygenerujemy
            domyślną okładkę na podstawie kategorii Twojego wydarzenia.
          </p>
        </div>
      </InfoBox>

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
    </EditSection>
  );
}
