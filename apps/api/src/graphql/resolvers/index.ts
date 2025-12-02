import type { Resolvers } from '../__generated__/resolvers-types';
import { Mutation } from './mutation';
import { Query } from './query';
import { JSONObjectScalar, JSONScalar } from './scalars';
import { Subscription } from './subscription';
import {
  dmMessageReactionsResolver,
  intentChatMessageReactionsResolver,
} from './fields/message-reactions';
import {
  intentSponsorshipResolver,
  intentSponsorshipPlanResolver,
  intentInviteLinksResolver,
  intentIsFavouriteResolver,
  intentCoverBlurhashResolver,
  intentFaqsResolver,
} from './fields/intent';
import { intentMemberIntentResolver } from './fields/intent-member';
import { UserFieldResolvers, UserProfileFieldResolvers } from './fields/user';
import { SessionUserFieldResolvers } from './fields/session-user';
import { IntentInviteLinkFieldResolvers } from './fields/invite-link';

export const resolvers: Pick<
  Resolvers,
  'Query' | 'Mutation' | 'Subscription' | 'JSON' | 'JSONObject'
> & {
  DmMessage?: Partial<Resolvers['DmMessage']>;
  IntentChatMessage?: Partial<Resolvers['IntentChatMessage']>;
  Intent?: Partial<Resolvers['Intent']>;
  IntentMember?: Partial<Resolvers['IntentMember']>;
  IntentInviteLink?: Partial<Resolvers['IntentInviteLink']>;
  User?: Partial<Resolvers['User']>;
  UserProfile?: Partial<Resolvers['UserProfile']>;
  SessionUser?: Partial<Resolvers['SessionUser']>;
} = {
  JSON: JSONScalar,
  JSONObject: JSONObjectScalar,
  Query,
  Mutation,
  Subscription,
  DmMessage: {
    reactions: dmMessageReactionsResolver,
  },
  IntentChatMessage: {
    reactions: intentChatMessageReactionsResolver,
  },
  Intent: {
    sponsorshipPlan: intentSponsorshipPlanResolver,
    inviteLinks: intentInviteLinksResolver,
    isFavourite: intentIsFavouriteResolver,
    coverBlurhash: intentCoverBlurhashResolver,
    faqs: intentFaqsResolver,
  },
  IntentMember: {
    intent: intentMemberIntentResolver,
  },
  IntentInviteLink: IntentInviteLinkFieldResolvers,
  User: UserFieldResolvers,
  UserProfile: UserProfileFieldResolvers,
  SessionUser: SessionUserFieldResolvers,
};
