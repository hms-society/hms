import { Inject, Injectable, Optional } from '@nestjs/common'
import type {
  CollaboratorRegistrationAttempt,
  CollaboratorRegistrationAttemptCreation,
} from '@hms/core/identity/domain/entities'
import type { CollaboratorRegistrationAttemptsRepository } from '@hms/core/identity/interfaces'
import { and, eq } from 'drizzle-orm'

import { DrizzleCollaboratorRegistrationAttemptMapper } from '@/identity/database/drizzle/mappers'
import { collaboratorRegistrationAttemptModel } from '@/identity/database/drizzle/models'
import {
  DrizzleIdentityRepository,
  type IdentityDatabaseExecutor,
} from '@/identity/database/drizzle/repositories/drizzle-identity-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleCollaboratorRegistrationAttemptsRepository
  extends DrizzleIdentityRepository
  implements CollaboratorRegistrationAttemptsRepository
{
  constructor(
    @Inject(DrizzleClient)
    drizzle: DrizzleClient,
    @Inject(DrizzleCollaboratorRegistrationAttemptMapper)
    private readonly attemptMapper: DrizzleCollaboratorRegistrationAttemptMapper,
    @Optional()
    databaseOverride?: IdentityDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  async findByNormalizedEmail(normalizedEmail: string) {
    const [attempt] = await this.database
      .select()
      .from(collaboratorRegistrationAttemptModel)
      .where(eq(collaboratorRegistrationAttemptModel.normalizedEmail, normalizedEmail))
      .limit(1)

    return attempt ? this.attemptMapper.toDomain(attempt) : undefined
  }

  async findByNormalizedEmailForUpdate(normalizedEmail: string) {
    const [attempt] = await this.database
      .select()
      .from(collaboratorRegistrationAttemptModel)
      .where(eq(collaboratorRegistrationAttemptModel.normalizedEmail, normalizedEmail))
      .limit(1)
      .for('update')

    return attempt ? this.attemptMapper.toDomain(attempt) : undefined
  }

  async add(attempt: CollaboratorRegistrationAttemptCreation) {
    const [createdAttempt] = await this.database
      .insert(collaboratorRegistrationAttemptModel)
      .values({
        normalizedEmail: attempt.normalizedEmail,
        payloadHash: attempt.payloadHash,
        status: 'pending_auth',
      })
      .onConflictDoNothing({
        target: collaboratorRegistrationAttemptModel.normalizedEmail,
      })
      .returning()

    return createdAttempt ? this.attemptMapper.toDomain(createdAttempt) : undefined
  }

  async removeAll(): Promise<void> {
    await this.database.delete(collaboratorRegistrationAttemptModel)
  }

  async removeByAuthUserId(authUserId: string): Promise<void> {
    await this.database
      .delete(collaboratorRegistrationAttemptModel)
      .where(eq(collaboratorRegistrationAttemptModel.authUserId, authUserId))
  }

  async markAuthInvited(attemptId: string, authUserId: string) {
    return this.updateAttempt(attemptId, {
      authUserId,
      status: 'auth_invited',
      lastError: null,
    })
  }

  async markCompleted(attemptId: string) {
    return this.updateAttempt(attemptId, { status: 'completed', lastError: null })
  }

  async markReconciliationRequired(attemptId: string, lastError: string) {
    return this.updateAttempt(attemptId, {
      status: 'reconciliation_required',
      lastError,
    })
  }

  async markLocalPersistenceFailed(
    attemptId: string,
    authUserId: string,
    lastError: string,
  ) {
    const [attempt] = await this.database
      .update(collaboratorRegistrationAttemptModel)
      .set({
        authUserId,
        status: 'auth_invited',
        lastError,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(collaboratorRegistrationAttemptModel.id, attemptId),
          eq(collaboratorRegistrationAttemptModel.authUserId, authUserId),
          eq(collaboratorRegistrationAttemptModel.status, 'auth_invited'),
        ),
      )
      .returning()

    return attempt ? this.attemptMapper.toDomain(attempt) : undefined
  }

  withDatabase(database: IdentityDatabaseExecutor) {
    return new DrizzleCollaboratorRegistrationAttemptsRepository(
      this.drizzleClient,
      this.attemptMapper,
      database,
    )
  }

  private async updateAttempt(
    attemptId: string,
    changes: Partial<Pick<CollaboratorRegistrationAttempt, 'status'>> & {
      authUserId?: string | null
      lastError?: string | null
    },
  ) {
    const [attempt] = await this.database
      .update(collaboratorRegistrationAttemptModel)
      .set({ ...changes, updatedAt: new Date() })
      .where(and(eq(collaboratorRegistrationAttemptModel.id, attemptId)))
      .returning()

    return attempt ? this.attemptMapper.toDomain(attempt) : undefined
  }
}
