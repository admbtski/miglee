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
  intentInviteLinksResolver,
} from './fields/intent';
import { intentMemberIntentResolver } from './fields/intent-member';
import { UserFieldResolvers } from './fields/user';
import { SessionUserFieldResolvers } from './fields/session-user';

export const resolvers: Pick<
  Resolvers,
  | 'Query'
  | 'Mutation'
  | 'Subscription'
  | 'JSON'
  | 'JSONObject'
  | 'DmMessage'
  | 'IntentChatMessage'
  | 'Intent'
  | 'IntentMember'
  | 'User'
  | 'SessionUser'
> = {
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
    sponsorship: intentSponsorshipResolver,
    inviteLinks: intentInviteLinksResolver,
  },
  IntentMember: {
    intent: intentMemberIntentResolver,
  },
  User: UserFieldResolvers,
  SessionUser: SessionUserFieldResolvers,
};
