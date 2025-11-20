'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, Eye, EyeOff, Users, Lock } from 'lucide-react';
import { useUpdateUserPrivacy } from '@/lib/api/user-profile';
import type { GetMyFullProfileQuery } from '@/lib/api/__generated__/react-query-update';

const privacySchema = z.object({
  dmPolicy: z.enum(['ALL', 'MEMBERS', 'INVITE_ONLY', 'NONE']),
  showLastSeen: z.enum(['ALL', 'MEMBERS', 'HIDDEN']),
  showLocation: z.enum(['CITY', 'APPROX', 'HIDDEN']),
  showEvents: z.enum(['ALL', 'MEMBERS', 'SELF']),
  showReviews: z.enum(['ALL', 'MEMBERS', 'SELF']),
  showStats: z.enum(['ALL', 'MEMBERS', 'SELF']),
  defaultAddressVisibility: z.enum(['PUBLIC', 'AFTER_JOIN', 'HIDDEN']),
  defaultMembersVisibility: z.enum(['PUBLIC', 'AFTER_JOIN', 'HIDDEN']),
});

type PrivacyFormData = z.infer<typeof privacySchema>;

type PrivacyTabProps = {
  user: GetMyFullProfileQuery['user'] | null | undefined;
  userId: string;
};

const DM_POLICY_OPTIONS = [
  {
    value: 'ALL',
    label: 'Everyone',
    description: 'Anyone can send you messages',
  },
  {
    value: 'MEMBERS',
    label: 'Event Members',
    description: 'Only people from your events',
  },
  {
    value: 'INVITE_ONLY',
    label: 'Invite Only',
    description: 'Only people you invite',
  },
  { value: 'NONE', label: 'No One', description: 'Disable direct messages' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ALL', label: 'Everyone', icon: Eye },
  { value: 'MEMBERS', label: 'Event Members', icon: Users },
  { value: 'SELF', label: 'Only Me', icon: Lock },
  { value: 'HIDDEN', label: 'Hidden', icon: EyeOff },
];

const LOCATION_OPTIONS = [
  { value: 'CITY', label: 'City & Country', icon: Eye },
  { value: 'APPROX', label: 'Approximate', icon: Users },
  { value: 'HIDDEN', label: 'Hidden', icon: EyeOff },
];

const ADDRESS_VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public', description: 'Everyone can see' },
  {
    value: 'AFTER_JOIN',
    label: 'After Join',
    description: 'Only after joining',
  },
  { value: 'HIDDEN', label: 'Hidden', description: 'Only organizer' },
];

export function PrivacyTab({ user }: PrivacyTabProps) {
  const updateMutation = useUpdateUserPrivacy();

  const {
    register,
    handleSubmit,
    formState: { isDirty },
    reset,
    watch,
    setValue,
  } = useForm<PrivacyFormData>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      dmPolicy: (user?.privacy?.dmPolicy as any) || 'ALL',
      showLastSeen: (user?.privacy?.showLastSeen as any) || 'ALL',
      showLocation: (user?.privacy?.showLocation as any) || 'CITY',
      showEvents: (user?.privacy?.showEvents as any) || 'ALL',
      showReviews: (user?.privacy?.showReviews as any) || 'ALL',
      showStats: (user?.privacy?.showStats as any) || 'ALL',
      defaultAddressVisibility:
        (user?.privacy?.defaultAddressVisibility as any) || 'PUBLIC',
      defaultMembersVisibility:
        (user?.privacy?.defaultMembersVisibility as any) || 'PUBLIC',
    },
  });

  const onSubmit = async (data: PrivacyFormData) => {
    await updateMutation.mutateAsync({
      input: data as any, // GraphQL expects string enums
    });

    reset(data);
  };

  const dmPolicy = watch('dmPolicy');
  const showLastSeen = watch('showLastSeen');
  const showLocation = watch('showLocation');
  const showEvents = watch('showEvents');
  const showReviews = watch('showReviews');
  const showStats = watch('showStats');
  const defaultAddressVisibility = watch('defaultAddressVisibility');
  const defaultMembersVisibility = watch('defaultMembersVisibility');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* DM Policy */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Direct Messages
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Control who can send you direct messages
        </p>
        <div className="mt-4 space-y-2">
          {DM_POLICY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                dmPolicy === option.value
                  ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50'
              }`}
            >
              <input
                {...register('dmPolicy')}
                type="radio"
                value={option.value}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {option.label}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Profile Visibility */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Profile Visibility
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Control who can see your profile information
        </p>

        <div className="mt-4 space-y-4">
          {/* Last Seen */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Last Seen
            </label>
            <div className="mt-2 flex gap-2">
              {VISIBILITY_OPTIONS.filter((o) => o.value !== 'SELF').map(
                (option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setValue('showLastSeen', option.value as any, {
                          shouldDirty: true,
                        })
                      }
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        showLastSeen === option.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Location
            </label>
            <div className="mt-2 flex gap-2">
              {LOCATION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue('showLocation', option.value as any, {
                        shouldDirty: true,
                      })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      showLocation === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Events
            </label>
            <div className="mt-2 flex gap-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue('showEvents', option.value as any, {
                        shouldDirty: true,
                      })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      showEvents === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Reviews
            </label>
            <div className="mt-2 flex gap-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue('showReviews', option.value as any, {
                        shouldDirty: true,
                      })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      showReviews === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Statistics
            </label>
            <div className="mt-2 flex gap-2">
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue('showStats', option.value as any, {
                        shouldDirty: true,
                      })
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      showStats === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Default Event Settings */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Default Event Settings
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          These settings will be applied to new events you create
        </p>

        <div className="mt-4 space-y-4">
          {/* Address Visibility */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Address Visibility
            </label>
            <div className="mt-2 space-y-2">
              {ADDRESS_VISIBILITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    defaultAddressVisibility === option.value
                      ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <input
                    {...register('defaultAddressVisibility')}
                    type="radio"
                    value={option.value}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {option.label}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Members Visibility */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Members List Visibility
            </label>
            <div className="mt-2 space-y-2">
              {ADDRESS_VISIBILITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    defaultMembersVisibility === option.value
                      ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <input
                    {...register('defaultMembersVisibility')}
                    type="radio"
                    value={option.value}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {option.label}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
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
    </form>
  );
}
