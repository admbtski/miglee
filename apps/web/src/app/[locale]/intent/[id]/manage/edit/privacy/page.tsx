'use client';

import { useState, useEffect } from 'react';
import { useEdit } from '../_components/edit-provider';
import { EditSection, FormField, InfoBox } from '../_components/edit-section';
import { Eye, EyeOff, Users, MapPin, Map, Info } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segment-control';

type Visibility = 'PUBLIC' | 'HIDDEN';
type AddressVisibility = 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';
type MembersVisibility = 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';

/**
 * Privacy Section
 * Features: Event visibility, Address visibility, Member list visibility, Map toggle
 */
export default function PrivacyPage() {
  const { intent, isLoading, saveSection } = useEdit();

  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [addressVisibility, setAddressVisibility] =
    useState<AddressVisibility>('PUBLIC');
  const [membersVisibility, setMembersVisibility] =
    useState<MembersVisibility>('PUBLIC');
  const [showOnMap, setShowOnMap] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize from intent data
  useEffect(() => {
    if (!intent) return;

    setVisibility(intent.visibility || 'PUBLIC');
    setAddressVisibility(intent.addressVisibility || 'PUBLIC');
    setMembersVisibility(intent.membersVisibility || 'PUBLIC');
    // showOnMap is derived from visibility for now
    setShowOnMap(intent.visibility === 'PUBLIC');
    setIsDirty(false);
  }, [intent]);

  // Save handler
  const handleSave = async () => {
    return saveSection('Privacy', {
      visibility,
      addressVisibility,
      membersVisibility,
    });
  };

  // Handle visibility change
  const handleVisibilityChange = (v: Visibility) => {
    setVisibility(v);
    // If hidden, can't show on map
    if (v === 'HIDDEN') {
      setShowOnMap(false);
    }
    setIsDirty(true);
  };

  return (
    <EditSection
      title="Privacy"
      description="Control who can see your event and its details"
      onSave={handleSave}
      isDirty={isDirty}
      isLoading={isLoading}
    >
      {/* Event Visibility */}
      <FormField
        label="Event visibility"
        description="Choose who can discover your event"
        required
      >
        <div className="space-y-3">
          <SegmentedControl<Visibility>
            value={visibility}
            onChange={handleVisibilityChange}
            size="md"
            fullWidth
            withPill
            animated
            options={[
              { value: 'PUBLIC', label: 'Public', Icon: Eye },
              { value: 'HIDDEN', label: 'Hidden', Icon: EyeOff },
            ]}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {visibility === 'PUBLIC'
              ? 'Anyone can find your event in search and on the map'
              : 'Event is only accessible via direct link'}
          </p>
        </div>
      </FormField>

      {/* Map Visibility - only for public events */}
      {visibility === 'PUBLIC' && (
        <FormField
          label="Show on map"
          description="Display your event on the public map"
        >
          <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <input
              type="checkbox"
              checked={showOnMap}
              onChange={(e) => {
                setShowOnMap(e.target.checked);
                setIsDirty(true);
              }}
              className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Display on map
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Event will appear on the public events map
              </p>
            </div>
          </label>
        </FormField>
      )}

      {/* Address Visibility */}
      <FormField
        label="Address visibility"
        description="Control when participants can see the exact location"
      >
        <div className="space-y-2">
          {(['PUBLIC', 'AFTER_JOIN', 'HIDDEN'] as const).map((option) => (
            <label
              key={option}
              className={[
                'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                addressVisibility === option
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800',
              ].join(' ')}
            >
              <input
                type="radio"
                name="addressVisibility"
                value={option}
                checked={addressVisibility === option}
                onChange={() => {
                  setAddressVisibility(option);
                  setIsDirty(true);
                }}
                className="mt-0.5 w-4 h-4 border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {option === 'PUBLIC' && 'Always visible'}
                    {option === 'AFTER_JOIN' && 'After joining'}
                    {option === 'HIDDEN' && 'Always hidden'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {option === 'PUBLIC' && 'Everyone can see the exact address'}
                  {option === 'AFTER_JOIN' &&
                    'Only participants see the address after joining'}
                  {option === 'HIDDEN' &&
                    'Address is never shown (use privacy radius instead)'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </FormField>

      {/* Member List Visibility */}
      <FormField
        label="Member list visibility"
        description="Control who can see the list of participants"
      >
        <div className="space-y-2">
          {(['PUBLIC', 'AFTER_JOIN', 'HIDDEN'] as const).map((option) => (
            <label
              key={option}
              className={[
                'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                membersVisibility === option
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800',
              ].join(' ')}
            >
              <input
                type="radio"
                name="membersVisibility"
                value={option}
                checked={membersVisibility === option}
                onChange={() => {
                  setMembersVisibility(option);
                  setIsDirty(true);
                }}
                className="mt-0.5 w-4 h-4 border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {option === 'PUBLIC' && 'Always visible'}
                    {option === 'AFTER_JOIN' && 'After joining'}
                    {option === 'HIDDEN' && 'Always hidden'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {option === 'PUBLIC' && 'Anyone can see who is attending'}
                  {option === 'AFTER_JOIN' &&
                    'Only participants can see other attendees'}
                  {option === 'HIDDEN' && 'Participant list is never shown'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </FormField>

      {/* Info */}
      <InfoBox>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong className="font-medium">Privacy tip:</strong> For private
            gatherings, set the event to Hidden and share the link directly with
            invitees.
          </p>
        </div>
      </InfoBox>
    </EditSection>
  );
}
