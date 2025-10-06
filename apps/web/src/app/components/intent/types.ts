export type CreateIntentInput = {
  title: string;
  interestId: string;
  description?: string;
  startAt: string; // ISO
  endAt: string; // ISO
  allowJoinLate: boolean;
  min: number;
  max: number;
  mode: 'ONE_TO_ONE' | 'GROUP';
  location: { lat: number; lng: number; address?: string; radiusKm?: number };
  visibility: 'PUBLIC' | 'HIDDEN';
  notes?: string;
};

// Simple shape for suggestion cards (anti-duplication)
export type IntentSuggestion = {
  id: string;
  title: string;
  author: string;
  distanceKm: number;
  startAt: string; // ISO
  endAt: string; // ISO
  min: number;
  max: number;
  taken: number;
};
