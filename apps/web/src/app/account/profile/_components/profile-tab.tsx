/**
 * Profile Tab Component
 * Allows users to edit their profile information, avatar, and cover image
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, X, Camera, Image as ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateUserProfile } from '@/lib/api/user-profile';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { LocationCombo } from '@/components/forms/location-combobox';
import { useAvatarUpload, useCoverUpload } from '@/lib/media/use-media-upload';
import { buildAvatarUrl, buildUserCoverUrl } from '@/lib/media/url';
import { useMeQuery } from '@/lib/api/auth';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import type { TabProps, LocationData } from '../_types';
import { COMMON_LANGUAGES, VALIDATION_LIMITS } from '../_constants';

const profileSchema = z.object({
  displayName: z
    .string()
    .min(
      VALIDATION_LIMITS.displayName.min,
      `Display name must be at least ${VALIDATION_LIMITS.displayName.min} characters`
    )
    .max(
      VALIDATION_LIMITS.displayName.max,
      `Display name must be at most ${VALIDATION_LIMITS.displayName.max} characters`
    )
    .optional()
    .or(z.literal('')),
  bioShort: z
    .string()
    .max(
      VALIDATION_LIMITS.bioShort.max,
      `Short bio must be at most ${VALIDATION_LIMITS.bioShort.max} characters`
    )
    .optional()
    .or(z.literal('')),
  bioLong: z
    .string()
    .max(
      VALIDATION_LIMITS.bioLong.max,
      `Long bio must be at most ${VALIDATION_LIMITS.bioLong.max} characters`
    )
    .optional()
    .or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  speaks: z.array(z.string()).optional(),
  interests: z
    .array(z.string())
    .max(
      VALIDATION_LIMITS.interests.max,
      `Maximum ${VALIDATION_LIMITS.interests.max} interests`
    )
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileTab({ user }: TabProps) {
  const [newInterest, setNewInterest] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Location state
  const [locationText, setLocationText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );

  // Image upload states
  const [avatarCropModalOpen, setAvatarCropModalOpen] = useState(false);
  const [coverCropModalOpen, setCoverCropModalOpen] = useState(false);
  const [selectedAvatarSrc, setSelectedAvatarSrc] = useState<string | null>(
    null
  );
  const [selectedCoverSrc, setSelectedCoverSrc] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const updateMutation = useUpdateUserProfile();

  const { data } = useMeQuery();

  const userId = data?.me?.id;

  // Media upload hooks
  const avatarUpload = useAvatarUpload(userId!, {
    onSuccess: () => {
      setAvatarCropModalOpen(false);
      setSelectedAvatarSrc(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
      // Invalidate queries to refresh avatar
      queryClient.invalidateQueries({ queryKey: ['MyFullProfile'] });
      queryClient.invalidateQueries({ queryKey: ['Me'] });
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar: ' + error.message);
    },
  });

  const coverUpload = useCoverUpload(userId, {
    onSuccess: () => {
      setCoverCropModalOpen(false);
      setSelectedCoverSrc(null);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
      // Invalidate queries to refresh cover
      queryClient.invalidateQueries({ queryKey: ['MyFullProfile'] });
      queryClient.invalidateQueries({ queryKey: ['Me'] });
    },
    onError: (error) => {
      console.error('Error uploading cover:', error);
      alert('Failed to upload cover: ' + error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      // Initialize displayName = user.name if profile doesn't exist
      displayName: user?.profile?.displayName || user?.name || '',
      bioShort: user?.profile?.bioShort || '',
      bioLong: user?.profile?.bioLong || '',
      city: user?.profile?.city || '',
      country: user?.profile?.country || '',
      speaks: user?.profile?.speaks || [],
      interests: user?.profile?.interests || [],
    },
  });

  const interests = watch('interests') || [];
  const bioShort = watch('bioShort') || '';
  const bioLong = watch('bioLong') || '';

  // Sync selected languages with form
  useEffect(() => {
    setSelectedLanguages(watch('speaks') || []);
  }, [watch('speaks')]);

  // Initialize location text from user data
  useEffect(() => {
    if (user?.profile?.city || user?.profile?.country) {
      const parts = [user.profile.city, user.profile.country].filter(Boolean);
      setLocationText(parts.join(', '));
      setSelectedLocation({
        city: user.profile.city || undefined,
        country: user.profile.country || undefined,
        lat: user.profile.homeLat || undefined,
        lng: user.profile.homeLng || undefined,
      });
    }
  }, [
    user?.profile?.city,
    user?.profile?.country,
    user?.profile?.homeLat,
    user?.profile?.homeLng,
  ]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateMutation.mutateAsync({
      input: {
        displayName: data.displayName || undefined,
        bioShort: data.bioShort || undefined,
        bioLong: data.bioLong || undefined,
        city: selectedLocation?.city || undefined,
        country: selectedLocation?.country || undefined,
        homeLat: selectedLocation?.lat || undefined,
        homeLng: selectedLocation?.lng || undefined,
        speaks: selectedLanguages.length > 0 ? selectedLanguages : undefined,
        interests:
          data.interests && data.interests.length > 0
            ? data.interests
            : undefined,
      },
    });

    reset(data);
  };

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed) && interests.length < 20) {
      setValue('interests', [...interests, trimmed], { shouldDirty: true });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setValue(
      'interests',
      interests.filter((i) => i !== interest),
      { shouldDirty: true }
    );
  };

  const handleToggleLanguage = (code: string) => {
    const newLangs = selectedLanguages.includes(code)
      ? selectedLanguages.filter((l) => l !== code)
      : [...selectedLanguages, code];

    setSelectedLanguages(newLangs);
    setValue('speaks', newLangs, { shouldDirty: true });
  };

  const handleLocationPick = (place: {
    placeId?: string;
    address?: string;
    lat?: number;
    lng?: number;
    displayName?: string;
  }) => {
    // Extract city and country from address
    const addressParts = place.address?.split(',').map((p) => p.trim()) || [];
    const city = addressParts[0] || place.displayName || '';
    const country = addressParts[addressParts.length - 1] || '';

    setSelectedLocation({
      city,
      country,
      lat: place.lat,
      lng: place.lng,
    });

    setLocationText(place.displayName || place.address || '');
    setValue('city', city, { shouldDirty: true });
    setValue('country', country, { shouldDirty: true });
  };

  // Image upload handlers
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedAvatarSrc(reader.result as string);
      setAvatarCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedCoverSrc(reader.result as string);
      setCoverCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCropComplete = async (croppedBlob: Blob) => {
    try {
      // Convert blob to File
      const file = new File([croppedBlob], 'avatar.webp', {
        type: 'image/webp',
      });

      // Upload using the hook
      await avatarUpload.uploadAsync(file);
    } catch (error) {
      // Error is already handled by the hook's onError callback
      console.error('Avatar upload failed:', error);
    }
  };

  const handleCoverCropComplete = async (croppedBlob: Blob) => {
    try {
      // Convert blob to File
      const file = new File([croppedBlob], 'cover.webp', {
        type: 'image/webp',
      });

      // Upload using the hook
      await coverUpload.uploadAsync(file);
    } catch (error) {
      // Error is already handled by the hook's onError callback
      console.error('Cover upload failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar & Cover Upload */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Profile Images
        </h3>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Avatar
          </label>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Recommended: Square image, at least 512x512px
          </p>
          <div className="mt-2 flex items-center gap-4">
            {user?.avatarKey ? (
              <BlurHashImage
                src={buildAvatarUrl(user.avatarKey, 'lg')}
                blurhash={user.avatarBlurhash}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover"
                width={160}
                height={160}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-300">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUpload.isUploading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Camera className="h-4 w-4" />
              {avatarUpload.isUploading ? 'Uploading...' : 'Change Avatar'}
            </button>
          </div>
        </div>

        {/* Cover */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Cover Image
          </label>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Recommended: 1920x1080px (16:9 aspect ratio)
          </p>
          <div className="mt-2">
            {user?.profile?.coverKey ? (
              <div className="relative h-32 w-full overflow-hidden rounded-lg">
                <BlurHashImage
                  src={buildUserCoverUrl(user.profile.coverKey, 'card')}
                  blurhash={user.profile.coverBlurhash}
                  alt="Cover"
                  className="h-full w-full object-cover"
                  width={480}
                  height={270}
                />
              </div>
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-zinc-400" />
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    No cover image
                  </p>
                </div>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUpload.isUploading}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ImageIcon className="h-4 w-4" />
              {coverUpload.isUploading ? 'Uploading...' : 'Change Cover'}
            </button>
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Display Name
        </label>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          This is how others will see you (3-40 characters)
        </p>
        <input
          {...register('displayName')}
          type="text"
          id="displayName"
          placeholder={user?.name || 'Your display name'}
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        {errors.displayName && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.displayName.message}
          </p>
        )}
      </div>

      {/* Short Bio */}
      <div>
        <label
          htmlFor="bioShort"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Short Bio
        </label>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          A brief description (max 200 characters)
        </p>
        <textarea
          {...register('bioShort')}
          id="bioShort"
          rows={2}
          placeholder="Tell us about yourself in a few words..."
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <div className="mt-1 flex items-center justify-between">
          <div>
            {errors.bioShort && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.bioShort.message}
              </p>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {bioShort.length}/200
          </p>
        </div>
      </div>

      {/* Long Bio */}
      <div>
        <label
          htmlFor="bioLong"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          About Me
        </label>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          A longer description (max 1000 characters)
        </p>
        <textarea
          {...register('bioLong')}
          id="bioLong"
          rows={6}
          placeholder="Share more about your interests, experience, and what you're looking for..."
          className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <div className="mt-1 flex items-center justify-between">
          <div>
            {errors.bioLong && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.bioLong.message}
              </p>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {bioLong.length}/1000
          </p>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Location
        </label>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Search for your city (only cities are selectable)
        </p>
        <div className="mt-2">
          <LocationCombo
            value={locationText}
            onChangeText={setLocationText}
            onPickPlace={handleLocationPick}
            placeholder="Type your city name..."
            includedPrimaryTypes={['locality']}
          />
        </div>
        {selectedLocation && (
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Selected: {selectedLocation.city}
            {selectedLocation.country && `, ${selectedLocation.country}`}
          </p>
        )}
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Languages
        </label>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Select the languages you speak
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMON_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleToggleLanguage(lang.code)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                selectedLanguages.includes(lang.code)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Interests
        </label>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Add up to 20 interests or hobbies
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInterest();
              }
            }}
            placeholder="e.g., Cycling, Photography"
            disabled={interests.length >= 20}
            className="block flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <button
            type="button"
            onClick={handleAddInterest}
            disabled={!newInterest.trim() || interests.length >= 20}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {errors.interests && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.interests.message}
          </p>
        )}
        {interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => reset()}
          disabled={!isDirty || updateMutation.isPending}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Image Crop Modals */}
      {selectedAvatarSrc && (
        <ImageCropModal
          open={avatarCropModalOpen}
          onClose={() => {
            setAvatarCropModalOpen(false);
            setSelectedAvatarSrc(null);
            if (avatarInputRef.current) {
              avatarInputRef.current.value = '';
            }
          }}
          imageSrc={selectedAvatarSrc}
          aspect={1} // Square for avatar
          onCropComplete={handleAvatarCropComplete}
          title="Crop Avatar"
          isUploading={avatarUpload.isUploading}
        />
      )}

      {selectedCoverSrc && (
        <ImageCropModal
          open={coverCropModalOpen}
          onClose={() => {
            setCoverCropModalOpen(false);
            setSelectedCoverSrc(null);
            if (coverInputRef.current) {
              coverInputRef.current.value = '';
            }
          }}
          imageSrc={selectedCoverSrc}
          aspect={16 / 9} // 16:9 for cover
          onCropComplete={handleCoverCropComplete}
          title="Crop Cover Image"
          isUploading={coverUpload.isUploading}
        />
      )}
    </form>
  );
}
