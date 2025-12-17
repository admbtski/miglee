'use client';

/**
 * Location Section
 * Features: Meeting type, address autocomplete, map preview, radius slider, online link
 */

// TODO i18n: All hardcoded strings (labels, descriptions, errors, tips)

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Globe,
  Info,
  Laptop,
  Link as LinkIcon,
  MapPin,
  Navigation,
} from 'lucide-react';

import { LocationCombo } from '@/components/forms/location-combobox';
import { SegmentedControl } from '@/components/ui/segment-control';
import { MapPreview } from '@/features/maps';
import {
  reverseGeocode,
  reverseGeocodeLatLng,
} from '@/features/maps';

import { useEdit } from '../_components/edit-provider';
import { EditSection, FormField, InfoBox } from '../_components/edit-section';

type MeetingKind = 'ONSITE' | 'ONLINE' | 'HYBRID';

const RADIUS_OPTIONS = [0, 0.1, 0.2, 0.5, 1, 2, 3, 5, 10];

export default function LocationPage() {
  const { event, isLoading, saveSection } = useEdit();

  const [meetingKind, setMeetingKind] = useState<MeetingKind>('ONSITE');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(1);
  const [onlineUrl, setOnlineUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocating, setIsLocating] = useState(false);

  // Initialize from event data
  useEffect(() => {
    if (!event) return;

    setMeetingKind(event.meetingKind || 'ONSITE');
    setAddress(event.address || '');
    setLat(event.lat);
    setLng(event.lng);
    setPlaceId(event.placeId);
    setRadiusKm(event.radiusKm ?? 1);
    setOnlineUrl(event.onlineUrl || '');
    setNotes(event.notes || '');
    setIsDirty(false);
  }, [event]);

  const showOnsite = meetingKind === 'ONSITE' || meetingKind === 'HYBRID';
  const showOnline = meetingKind === 'ONLINE' || meetingKind === 'HYBRID';

  const center = useMemo(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }
    return null;
  }, [lat, lng]);

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (showOnsite && !address && lat === null) {
      newErrors.address = 'Location is required for onsite events';
    }

    if (showOnline && onlineUrl) {
      try {
        const url = new URL(onlineUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.onlineUrl = 'Link must start with http:// or https://';
        }
      } catch {
        newErrors.onlineUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [showOnsite, showOnline, address, lat, onlineUrl]);

  // Save handler
  const handleSave = async () => {
    if (!validate()) return false;

    // Build location object for onsite/hybrid events
    const locationData = showOnsite
      ? {
          address: address || null,
          lat: lat,
          lng: lng,
          placeId: placeId,
          radiusKm: radiusKm,
        }
      : null;

    return saveSection('Location', {
      meetingKind,
      location: locationData,
      onlineUrl: showOnline ? onlineUrl || null : null,
      notes: notes || null,
    });
  };

  // Use my location
  const handleUseMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setErrors((e) => ({ ...e, address: 'Geolocation not supported' }));
      return;
    }

    setIsLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        });
      });

      const newLat = pos.coords.latitude;
      const newLng = pos.coords.longitude;
      setLat(newLat);
      setLng(newLng);
      setIsDirty(true);

      // Reverse geocode
      const result = await reverseGeocodeLatLng(newLat, newLng).catch(
        () => null
      );
      if (result) {
        setAddress(result);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      setErrors((e) => ({ ...e, address: 'Could not get your location' }));
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Handle map position change
  const handleMapPositionChange = useCallback(
    async (pos: { lat: number; lng: number }) => {
      setLat(pos.lat);
      setLng(pos.lng);
      setIsDirty(true);

      try {
        const result = await reverseGeocode(pos);
        if (result.formattedAddress) {
          setAddress(result.formattedAddress);
        }
        if (result.placeId) {
          setPlaceId(result.placeId);
        }
      } catch {
        // Ignore geocode errors
      }
    },
    []
  );

  return (
    <EditSection
      title="Location"
      description="Set where your event takes place"
      onSave={handleSave}
      isDirty={isDirty}
      isLoading={isLoading}
    >
      {/* Meeting Type */}
      <FormField
        label="Event type"
        description="Choose how participants will attend"
        required
      >
        <SegmentedControl<MeetingKind>
          value={meetingKind}
          onChange={(v) => {
            setMeetingKind(v);
            setIsDirty(true);
          }}
          size="md"
          fullWidth
          withPill
          animated
          options={[
            { value: 'ONSITE', label: 'In-person', Icon: MapPin },
            { value: 'ONLINE', label: 'Online', Icon: Laptop },
            { value: 'HYBRID', label: 'Hybrid', Icon: Globe },
          ]}
        />
      </FormField>

      {/* Online Link */}
      {showOnline && (
        <FormField
          label="Meeting link"
          description="Zoom, Teams, Meet, Discord, or any https:// link"
          error={errors.onlineUrl}
        >
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={onlineUrl}
              onChange={(e) => {
                setOnlineUrl(e.target.value);
                setIsDirty(true);
                if (errors.onlineUrl)
                  setErrors((er) => ({ ...er, onlineUrl: '' }));
              }}
              placeholder="https://zoom.us/j/..."
              className={[
                'w-full rounded-xl border pl-10 pr-4 py-3 text-sm transition-all',
                'bg-white dark:bg-zinc-900/60',
                'text-zinc-900 dark:text-zinc-100',
                'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                errors.onlineUrl
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
                'focus:outline-none focus:ring-2',
              ].join(' ')}
            />
          </div>
        </FormField>
      )}

      {/* Address */}
      {showOnsite && (
        <>
          <FormField
            label="Address"
            description="Search for a location or use your current position"
            required
            error={errors.address}
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <LocationCombo
                  value={address}
                  loadingOverride={isLocating}
                  onChangeText={(txt) => {
                    setAddress(txt);
                    setIsDirty(true);
                    if (errors.address)
                      setErrors((e) => ({ ...e, address: '' }));
                  }}
                  onPickPlace={({
                    address: addr,
                    lat: newLat,
                    lng: newLng,
                    placeId: newPlaceId,
                  }) => {
                    if (addr) setAddress(addr);
                    if (typeof newLat === 'number') setLat(newLat);
                    if (typeof newLng === 'number') setLng(newLng);
                    if (newPlaceId) setPlaceId(newPlaceId);
                    setIsDirty(true);
                    if (errors.address)
                      setErrors((e) => ({ ...e, address: '' }));
                  }}
                  bias={{
                    location: { lat: 52.2297, lng: 21.0122 },
                    radius: 50000,
                  }}
                  placeholder="Search address or place..."
                />
              </div>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all"
              >
                <Navigation className="w-4 h-4" />
                {isLocating ? 'Locating...' : 'Use my location'}
              </button>
            </div>
          </FormField>

          {/* Map Preview */}
          <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <MapPreview
              center={center}
              zoom={center ? 15 : 6}
              draggableMarker
              clickToPlace
              className="w-full h-[250px]"
              onUserSetPosition={handleMapPositionChange}
            />
          </div>

          {/* Privacy Radius */}
          <FormField
            label="Privacy radius"
            description="Hide exact location within this radius. 0 = show exact address."
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRadiusKm(r);
                      setIsDirty(true);
                    }}
                    className={[
                      'px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                      radiusKm === r
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {r === 0 ? 'Exact' : `${r} km`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {radiusKm === 0
                  ? 'Exact address will be shown publicly'
                  : `Location will be shown within ${radiusKm} km radius`}
              </p>
            </div>
          </FormField>

          {/* Logistic Note */}
          <FormField
            label="Logistic note"
            description="Additional instructions for finding the venue"
          >
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setIsDirty(true);
              }}
              rows={2}
              placeholder="e.g. Enter through the side door, look for the blue sign..."
              className={[
                'w-full rounded-xl border px-4 py-3 text-sm transition-all resize-none',
                'bg-white dark:bg-zinc-900/60',
                'text-zinc-900 dark:text-zinc-100',
                'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
                'border-zinc-300 dark:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/40',
                'focus:outline-none focus:ring-2',
              ].join(' ')}
            />
          </FormField>
        </>
      )}

      {/* Info */}
      <InfoBox>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            {showOnsite && (
              <>
                <strong className="font-medium">Tip:</strong> Drag the map pin
                to adjust the exact location. Use the radius slider to protect
                your privacy.
              </>
            )}
            {showOnline && !showOnsite && (
              <>
                <strong className="font-medium">Tip:</strong> Add your meeting
                link now or share it later with participants.
              </>
            )}
            {showOnline && showOnsite && (
              <>
                <strong className="font-medium">Hybrid event:</strong> Provide
                both a physical location and online meeting link.
              </>
            )}
          </p>
        </div>
      </InfoBox>
    </EditSection>
  );
}
