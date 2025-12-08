/**
 * Type definitions for Plans and Bills page
 */

export type Conversation = {
  id: string;
  title: string;
  membersCount: number;
  preview: string;
  lastMessageAt: string; // np. "1m", "14m", "2h"
  unread: number;
  avatar?: string; // litera lub url
};

export type Message = {
  id: string;
  text: string;
  at: string;
  side: 'left' | 'right';
  author: { id: string; name: string; avatar?: string };
  /** większy „blok” wiadomości, jak na zrzucie */
  block?: boolean;
};

export type CardBrand = 'Visa' | 'MasterCard' | 'AmEx' | 'Discover';

export type CardItem = {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: string; // "12"
  expYear: string; // "25"
  isDefault?: boolean;
  expired?: boolean;
};
