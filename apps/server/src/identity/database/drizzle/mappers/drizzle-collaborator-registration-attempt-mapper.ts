import type { CollaboratorRegistrationAttempt } from '@hms/core/identity/domain/entities'

import type { DrizzleCollaboratorRegistrationAttempt } from '@/identity/database/drizzle/types/entities'

export class DrizzleCollaboratorRegistrationAttemptMapper {
  toDomain(
    attempt: DrizzleCollaboratorRegistrationAttempt,
  ): CollaboratorRegistrationAttempt {
    return {
      id: attempt.id,
      normalizedEmail: attempt.normalizedEmail,
      payloadHash: attempt.payloadHash,
      authUserId: attempt.authUserId ?? undefined,
      status: attempt.status,
      lastError: attempt.lastError ?? undefined,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
    }
  }
}
