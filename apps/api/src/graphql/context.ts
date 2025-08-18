import { MercuriusContext } from 'mercurius';

export interface GQLContext {
  // Add context properties here as needed
}

export async function createContext(_request: MercuriusContext['request']): Promise<GQLContext> {
  return {};
}
