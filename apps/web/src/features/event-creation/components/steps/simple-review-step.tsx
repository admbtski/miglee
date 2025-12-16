'use client';

// TODO i18n: Polish strings need translation
// TODO i18n: date formatting should be locale-aware

import {
  CalendarDays,
  Clock,
  Edit2,
  Eye,
  EyeOff,
  Globe2,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  Mail,
  MapPin,
  Users,
} from 'lucide-react';

import { useCategorySelection } from '@/features/event-creation/components/category-selection-provider';
import type { SimpleEventFormValues } from '@/features/events/types/event-form';

interface SimpleReviewStepProps {
  values: SimpleEventFormValues;
  coverPreview: string | null;
  onEditStep: (stepIndex: number) => void;
}

/**
 * SimpleReviewStep - Review and confirm before creating
 *
 * Shows summary of all entered data with edit buttons
 */
export function SimpleReviewStep({
  values,
  coverPreview,
  onEditStep,
}: SimpleReviewStepProps) {
  const { selected: categories } = useCategorySelection();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDuration = () => {
    const start = values.startAt;
    const end = values.endAt;
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours && minutes) return `${hours}h ${minutes}min`;
    if (hours) return `${hours}h`;
    return `${minutes}min`;
  };

  const getMeetingKindLabel = () => {
    switch (values.meetingKind) {
      case 'ONSITE':
        return 'Stacjonarne';
      case 'ONLINE':
        return 'Online';
      case 'HYBRID':
        return 'Hybrydowe';
      default:
        return values.meetingKind;
    }
  };

  const getMeetingKindIcon = () => {
    switch (values.meetingKind) {
      case 'ONSITE':
        return MapPin;
      case 'ONLINE':
        return LinkIcon;
      case 'HYBRID':
        return Globe2;
      default:
        return MapPin;
    }
  };

  const getCapacityLabel = () => {
    if (values.mode === 'ONE_TO_ONE') return '2 osoby (1:1)';
    if (values.min === values.max) return `${values.max} osób`;
    return `${values.min ?? 1} – ${values.max ?? 50} osób`;
  };

  const getVisibilityLabel = () => {
    return values.visibility === 'PUBLIC' ? 'Publiczne' : 'Ukryte';
  };

  const getJoinModeLabel = () => {
    switch (values.joinMode) {
      case 'OPEN':
        return 'Otwarte';
      case 'REQUEST':
        return 'Na prośbę';
      case 'INVITE_ONLY':
        return 'Na zaproszenie';
      default:
        return values.joinMode;
    }
  };

  const getJoinModeIcon = () => {
    switch (values.joinMode) {
      case 'OPEN':
        return Users;
      case 'REQUEST':
        return Mail;
      case 'INVITE_ONLY':
        return Lock;
      default:
        return Users;
    }
  };

  const MeetingIcon = getMeetingKindIcon();
  const JoinModeIcon = getJoinModeIcon();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Podsumowanie
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sprawdź wszystkie informacje przed utworzeniem wydarzenia.
        </p>
      </div>

      {/* Cover preview */}
      {coverPreview && (
        <div className="relative">
          <img
            src={coverPreview}
            alt="Okładka wydarzenia"
            className="w-full h-40 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => onEditStep(5)}
            className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-zinc-900/90 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm"
            title="Edytuj okładkę"
          >
            <Edit2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="space-y-3">
        {/* Title & Categories */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {values.title || 'Bez nazwy'}
              </h4>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {categories.map((cat) => (
                    <span
                      key={cat.slug}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >
                      {cat.label}
                    </span>
                  ))}
                </div>
              )}
              {values.description && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {values.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEditStep(0)}
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Edytuj podstawy"
            >
              <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Schedule */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDate(values.startAt)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Czas trwania: {getDuration()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Edytuj termin"
            >
              <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <MeetingIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {getMeetingKindLabel()}
                </p>
                {values.location?.address && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {values.location.address}
                  </p>
                )}
                {values.onlineUrl && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[250px]">
                    {values.onlineUrl}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Edytuj lokalizację"
            >
              <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Capacity */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {getCapacityLabel()}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tryb:{' '}
                  {values.mode === 'ONE_TO_ONE'
                    ? '1:1'
                    : values.mode === 'GROUP'
                      ? 'Grupowe'
                      : 'Niestandardowe'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Edytuj liczebność"
            >
              <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {values.visibility === 'PUBLIC' ? (
                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              ) : (
                <EyeOff className="w-5 h-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {getVisibilityLabel()}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                  <JoinModeIcon className="w-3 h-3" />
                  Dołączanie: {getJoinModeLabel()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Edytuj prywatność"
            >
              <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* No cover placeholder */}
        {!coverPreview && (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 border-dashed">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Brak okładki
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Możesz dodać później w panelu wydarzenia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditStep(5)}
                className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Dodaj okładkę"
              >
                <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
        <p className="text-sm text-emerald-900 dark:text-emerald-100">
          <strong className="font-semibold">Gotowe!</strong> Po utworzeniu
          wydarzenia zobaczysz panel konfiguracji, w którym ustawisz mapę,
          prywatność adresu, bardziej szczegółowe limity oraz dodatkowe opcje.
          Wydarzenie zostanie zapisane jako <strong>wersja robocza</strong> —
          opublikujesz je gdy będziesz gotowy.
        </p>
      </div>
    </div>
  );
}
