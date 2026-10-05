import type { ThirdParty } from './third-party'

export type ThirdPartyCreation = Omit<
  ThirdParty,
  'createdAt' | 'id' | 'status' | 'updatedAt'
>
