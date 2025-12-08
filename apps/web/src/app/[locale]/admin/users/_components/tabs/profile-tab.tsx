'use client';

import { useState } from 'react';
import {
  Loader2,
  Save,
  MapPin,
  Globe,
  Languages,
  Tag,
  Award,
  Calendar,
} from 'lucide-react';
import {
  useUserProfileQuery,
  useUpdateUserProfile,
} from '@/features/users/api/user-profile';
import { useGetCategoriesQuery as useCategoriesQuery } from '@/features/categories/api/categories';

type ProfileTabProps = {
  userId: string;
  onRefresh?: () => void;
};

export function ProfileTab({ userId }: ProfileTabProps) {
  const {
    data: profileData,
    isLoading,
    refetch,
  } = useUserProfileQuery({ id: userId }, { enabled: !!userId });

  const { data: categoriesData } = useCategoriesQuery({ limit: 100 });
  const updateMutation = useUpdateUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  const user = profileData?.user;
  const profile = user?.profile;
  const disciplines = user?.categoryLevels || [];
  const socialLinks = user?.socialLinks || [];
  const privacy = user?.privacy;
  const stats = user?.stats;

  const categories = categoriesData?.categories || [];

  const handleEdit = () => {
    setEditedData({
      displayName: profile?.displayName || '',
      bioShort: profile?.bioShort || '',
      bioLong: profile?.bioLong || '',
      city: profile?.city || '',
      country: profile?.country || '',
      speaks: profile?.speaks || [],
      interests: profile?.interests || [],
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const handleSave = async () => {
    if (!editedData) return;

    await updateMutation.mutateAsync({
      input: {
        displayName: editedData.displayName || undefined,
        bioShort: editedData.bioShort || undefined,
        bioLong: editedData.bioLong || undefined,
        city: editedData.city || undefined,
        country: editedData.country || undefined,
        speaks: editedData.speaks?.length > 0 ? editedData.speaks : undefined,
        interests:
          editedData.interests?.length > 0 ? editedData.interests : undefined,
      },
    });

    setIsEditing(false);
    setEditedData(null);
    refetch();
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c: any) => c.id === categoryId);
    if (!cat) return categoryId;
    if (typeof cat.names === 'object') {
      return cat.names.en || cat.names.pl || cat.slug;
    }
    return cat.slug;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
        <p className="text-sm text-red-600 dark:text-red-400">
          Nie udało się załadować profilu użytkownika.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Profil użytkownika
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Przeglądaj i edytuj informacje profilowe użytkownika
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edytuj profil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Zapisz
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Podstawowe informacje
        </h4>
        <div className="space-y-3">
          {/* Display Name */}
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Display Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData?.displayName || ''}
                onChange={(e) =>
                  setEditedData({ ...editedData, displayName: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {profile?.displayName || user.name || '-'}
              </p>
            )}
          </div>

          {/* Bio Short */}
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Krótki opis
            </label>
            {isEditing ? (
              <textarea
                value={editedData?.bioShort || ''}
                onChange={(e) =>
                  setEditedData({ ...editedData, bioShort: e.target.value })
                }
                rows={2}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {profile?.bioShort || '-'}
              </p>
            )}
          </div>

          {/* Bio Long */}
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Pełny opis
            </label>
            {isEditing ? (
              <textarea
                value={editedData?.bioLong || ''}
                onChange={(e) =>
                  setEditedData({ ...editedData, bioLong: e.target.value })
                }
                rows={4}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {profile?.bioLong || '-'}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <MapPin className="inline h-3 w-3" /> Miasto
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData?.city || ''}
                  onChange={(e) =>
                    setEditedData({ ...editedData, city: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              ) : (
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {profile?.city || '-'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <Globe className="inline h-3 w-3" /> Kraj
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData?.country || ''}
                  onChange={(e) =>
                    setEditedData({ ...editedData, country: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              ) : (
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {profile?.country || '-'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Languages className="h-4 w-4" />
          Języki
        </h4>
        {profile?.speaks && profile.speaks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.speaks.map((lang: string) => (
              <span
                key={lang}
                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {lang}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak informacji o językach
          </p>
        )}
      </div>

      {/* Interests */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Tag className="h-4 w-4" />
          Zainteresowania
        </h4>
        {profile?.interests && profile.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest: string) => (
              <span
                key={interest}
                className="rounded-lg bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak zainteresowań
          </p>
        )}
      </div>

      {/* Disciplines */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Award className="h-4 w-4" />
          Dyscypliny sportowe
        </h4>
        {disciplines.length > 0 ? (
          <div className="space-y-2">
            {disciplines.map((discipline: any) => (
              <div
                key={discipline.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {getCategoryName(discipline.categoryId)}
                  </p>
                  {discipline.notes && (
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {discipline.notes}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    discipline.level === 'BEGINNER'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : discipline.level === 'INTERMEDIATE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  }`}
                >
                  {discipline.level}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak dyscyplin sportowych
          </p>
        )}
      </div>

      {/* Social Links */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Globe className="h-4 w-4" />
          Linki społecznościowe
        </h4>
        {socialLinks.length > 0 ? (
          <div className="space-y-2">
            {socialLinks.map((link: any) => (
              <div
                key={link.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                    {link.provider}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {link.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak linków społecznościowych
          </p>
        )}
      </div>

      {/* Privacy Settings */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Ustawienia prywatności
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">DM Policy:</span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {privacy?.dmPolicy || 'EVERYONE'}
            </span>
          </div>
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">
              Show Last Seen:
            </span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {privacy?.showLastSeen || 'ALL'}
            </span>
          </div>
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">
              Show Location:
            </span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {privacy?.showLocation || 'ALL'}
            </span>
          </div>
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">
              Show Events:
            </span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {privacy?.showEvents || 'ALL'}
            </span>
          </div>
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">
              Show Reviews:
            </span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {privacy?.showReviews || 'ALL'}
            </span>
          </div>
          <div>
            <span className="text-zinc-600 dark:text-zinc-400">
              Show Stats:
            </span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {privacy?.showStats || 'ALL'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Calendar className="h-4 w-4" />
          Statystyki
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.eventsCreated || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Utworzonych wydarzeń
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.eventsJoined || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Dołączonych wydarzeń
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats?.reviewsCount || 0}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Recenzji</p>
          </div>
        </div>
        {(stats?.hostRatingAvg || stats?.attendeeRatingAvg) && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 text-center dark:border-zinc-700">
            <div>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.hostRatingAvg?.toFixed(1) || '-'}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Ocena jako organizator
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.attendeeRatingAvg?.toFixed(1) || '-'}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Ocena jako uczestnik
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
