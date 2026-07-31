import type {
  CollaboratorRegistrationAttempt,
  CollaboratorRegistrationAttemptCreation,
} from '../domain/entities'

export interface CollaboratorRegistrationAttemptsRepository {
  findByNormalizedEmail(
    normalizedEmail: string,
  ): Promise<CollaboratorRegistrationAttempt | undefined>
  findByNormalizedEmailForUpdate(
    normalizedEmail: string,
  ): Promise<CollaboratorRegistrationAttempt | undefined>
  add(
    attempt: CollaboratorRegistrationAttemptCreation,
  ): Promise<CollaboratorRegistrationAttempt | undefined>
  removeAll(): Promise<void>
  removeByAuthUserId(authUserId: string): Promise<void>
  markAuthInvited(
    attemptId: string,
    authUserId: string,
  ): Promise<CollaboratorRegistrationAttempt | undefined>
  markCompleted(attemptId: string): Promise<CollaboratorRegistrationAttempt | undefined>
  markReconciliationRequired(
    attemptId: string,
    lastError: string,
  ): Promise<CollaboratorRegistrationAttempt | undefined>
  markLocalPersistenceFailed(
    attemptId: string,
    authUserId: string,
    lastError: string,
  ): Promise<CollaboratorRegistrationAttempt | undefined>
}
