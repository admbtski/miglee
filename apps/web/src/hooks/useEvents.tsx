import {
  useQuery,
  useSuspenseQuery,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { gqlClient } from '../client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
};

export type Event = {
  __typename?: 'Event';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  events: Array<Event>;
};

export type QueryEventsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type GetEventsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetEventsQuery = {
  __typename?: 'Query';
  events: Array<{
    __typename?: 'Event';
    id: string;
    title: string;
    createdAt: any;
  }>;
};

export const GetEventsDocument = `
      query GetEvents($limit: Int = 10) {
    events(limit: $limit) {
      id
      title
      createdAt
    }
  }
      `;

export const useGetEventsQuery = <TData = GetEventsQuery, TError = unknown>(
  variables?: GetEventsQueryVariables,
  options?: Omit<UseQueryOptions<GetEventsQuery, TError, TData>, 'queryKey'> & {
    queryKey?: UseQueryOptions<GetEventsQuery, TError, TData>['queryKey'];
  }
) => {
  return useQuery<GetEventsQuery, TError, TData>({
    queryKey:
      variables === undefined ? ['GetEvents'] : ['GetEvents', variables],
    queryFn: async () => {
      return gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
        GetEventsDocument,
        { limit: 10 }
      );
    },
    // queryFn: gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
    //   GetEventsDocument,
    //   variables
    // ),
    ...options,
  });
};

useGetEventsQuery.getKey = (variables?: GetEventsQueryVariables) =>
  variables === undefined ? ['GetEvents'] : ['GetEvents', variables];

export const useSuspenseGetEventsQuery = <
  TData = GetEventsQuery,
  TError = unknown,
>(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseSuspenseQueryOptions<GetEventsQuery, TError, TData>,
    'queryKey'
  > & {
    queryKey?: UseSuspenseQueryOptions<
      GetEventsQuery,
      TError,
      TData
    >['queryKey'];
  }
) => {
  return useSuspenseQuery<GetEventsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ['GetEventsSuspense']
        : ['GetEventsSuspense', variables],
    queryFn: gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
      GetEventsDocument,
      variables
    ),
    ...options,
  });
};

useSuspenseGetEventsQuery.getKey = (variables?: GetEventsQueryVariables) =>
  variables === undefined
    ? ['GetEventsSuspense']
    : ['GetEventsSuspense', variables];

useGetEventsQuery.fetcher = (
  variables?: GetEventsQueryVariables,
  options?: RequestInit['headers']
) =>
  gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
    GetEventsDocument,
    variables,
    options
  );
