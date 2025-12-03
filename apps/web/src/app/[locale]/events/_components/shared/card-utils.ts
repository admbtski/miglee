/**
 * Shared utilities for EventCard and PopupItem components
 */

import type { AddressVisibility } from '@/lib/api/__generated__/react-query-update';
import type { ComponentType } from 'react';
import { Eye, EyeOff, MapPin, UserCheck, Wifi as WifiIcon } from 'lucide-react';
import { HybridLocationIcon } from '@/components/ui/icons/hybrid-location-icon';

/**
 * Appearance config for card customization
 */
export interface CardAppearanceConfig {
  background?: string | null;
  shadow?: string | null;
}

export type AddressVisibilityMeta = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  canShow: boolean;
};

/**
 * Get metadata for address visibility setting
 */
export function getAddressVisibilityMeta(
  av: AddressVisibility | null | undefined
): AddressVisibilityMeta {
  if (!av) {
    return {
      label: 'Adres publiczny',
      Icon: Eye,
      canShow: true,
    };
  }

  const normalized = String(av).toUpperCase();

  if (normalized.includes('PUBLIC')) {
    return {
      label: 'Adres publiczny',
      Icon: Eye,
      canShow: true,
    };
  }

  if (normalized.includes('AFTER_JOIN')) {
    return {
      label: 'Adres po dołączeniu',
      Icon: UserCheck,
      canShow: false,
    };
  }

  return {
    label: 'Adres ukryty',
    Icon: EyeOff,
    canShow: false,
  };
}

/**
 * Get location display info based on meeting type and visibility
 */
export function getLocationDisplay(
  radiusKm: number | null | undefined,
  isHybrid: boolean,
  isOnsite: boolean,
  isOnline: boolean,
  avMeta: AddressVisibilityMeta,
  address: string | null | undefined,
  addressVisibility: AddressVisibility | null | undefined
): { Icon: ComponentType<{ className?: string }>; text: string } | null {
  if (isHybrid) {
    return {
      Icon: HybridLocationIcon,
      text: avMeta.canShow
        ? `${address?.split(',')[0]}${radiusKm ? ` ~ ${radiusKm} km` : ''} • Online`
        : addressVisibility === 'AFTER_JOIN'
          ? 'Szczegóły po dołączeniu'
          : 'Szczegóły ukryte',
    };
  }

  if (isOnsite) {
    return {
      Icon: MapPin,
      text: avMeta.canShow
        ? `${address?.split(',')[0]}${radiusKm ? ` ~ ${radiusKm} km` : ''}`
        : addressVisibility === 'AFTER_JOIN'
          ? 'Adres po dołączeniu'
          : 'Adres ukryty',
    };
  }

  if (isOnline) {
    return {
      Icon: WifiIcon,
      text: avMeta.canShow
        ? 'Online'
        : addressVisibility === 'AFTER_JOIN'
          ? 'Online (po dołączeniu)'
          : 'Online (ukryte)',
    };
  }

  return null;
}

/**
 * Check if a boost is still active (< 24 hours old)
 * @param boostedAtISO - ISO timestamp of when the event was boosted
 * @returns true if boost is active, false otherwise
 */
export function isBoostActive(
  boostedAtISO: string | null | undefined
): boolean {
  if (!boostedAtISO) return false;

  const boostedAt = new Date(boostedAtISO);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return boostedAt >= twentyFourHoursAgo;
}

/**
 * Get appearance styles from config
 */
export function getAppearanceStyle(
  appearance: { card?: CardAppearanceConfig } | null | undefined
): React.CSSProperties {
  const style: React.CSSProperties = {};
  const cardConfig = appearance?.card;

  if (cardConfig?.background) {
    style.background = cardConfig.background;
  }
  if (cardConfig?.shadow) {
    style.boxShadow = cardConfig.shadow;
  }

  return style;
}
