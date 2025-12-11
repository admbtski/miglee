import type { Resolvers } from '../__generated__/resolvers-types';
import { Mutation } from './mutation';
import { Query } from './query';
import { JSONObjectScalar, JSONScalar } from './scalars';
import { Subscription } from './subscription';
import {
  dmMessageReactionsResolver,
  eventChatMessageReactionsResolver,
} from './fields/message-reactions';
import {
  eventSponsorshipPlanResolver,
  eventInviteLinksResolver,
  eventIsFavouriteResolver,
  eventCoverBlurhashResolver,
  eventFaqsResolver,
  eventJoinQuestionsResolver,
  eventAppearanceResolver,
  eventAgendaItemsResolver,
} from './fields/event';
import { eventMemberEventResolver } from './fields/event-member';
import { UserFieldResolvers, UserProfileFieldResolvers } from './fields/user';
import { SessionUserFieldResolvers } from './fields/session-user';
import { eventInviteLinkFieldResolvers } from './fields/invite-link';

export const resolvers: Pick<
  Resolvers,
  'Query' | 'Mutation' | 'Subscription' | 'JSON' | 'JSONObject'
> & {
  DmMessage?: Partial<Resolvers['DmMessage']>;
  EventChatMessage?: Partial<Resolvers['EventChatMessage']>;
  Event?: Partial<Resolvers['Event']>;
  EventMember?: Partial<Resolvers['EventMember']>;
  EventInviteLink?: Partial<Resolvers['EventInviteLink']>;
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
  EventChatMessage: {
    reactions: eventChatMessageReactionsResolver,
  },
  Event: {
    sponsorshipPlan: eventSponsorshipPlanResolver,
    inviteLinks: eventInviteLinksResolver,
    isFavourite: eventIsFavouriteResolver,
    coverBlurhash: eventCoverBlurhashResolver,
    faqs: eventFaqsResolver,
    joinQuestions: eventJoinQuestionsResolver,
    appearance: eventAppearanceResolver,
    agendaItems: eventAgendaItemsResolver,
  },
  EventMember: {
    event: eventMemberEventResolver,
  },
  EventInviteLink: eventInviteLinkFieldResolvers,
  User: UserFieldResolvers,
  UserProfile: UserProfileFieldResolvers,
  SessionUser: SessionUserFieldResolvers,
};
