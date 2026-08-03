import type { CollaboratorRegistrationAttempt } from './collaborator-registration-attempt'

export type CollaboratorRegistrationAttemptCreation = Pick<
  CollaboratorRegistrationAttempt,
  'normalizedEmail' | 'payloadHash'
>
