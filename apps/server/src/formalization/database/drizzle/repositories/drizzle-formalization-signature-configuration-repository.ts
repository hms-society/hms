import { Inject, Injectable, Optional } from '@nestjs/common'
import type {
  FormalizationSignatory,
  FormalizationSignatoryDocument,
  FormalizationSignatureField,
  FormalizationSignaturePreview,
} from '@hms/core/formalization/domain/entities'
import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type {
  FormalizationSignaturePreviewClaim,
  FormalizationSignaturePreviewCleanupCandidate,
} from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureConfigurationRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureSourceReader } from '@hms/core/formalization/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, asc, eq, lte, or, sql } from 'drizzle-orm'

import { formalizationModel } from '@/formalization/database/drizzle/models/formalization-model'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import {
  formalizationSignatoryDocumentModel,
  formalizationSignatoryModel,
  formalizationSignatureFieldModel,
  formalizationSignaturePreviewModel,
} from '@/formalization/database/drizzle/models'
import { DrizzleFormalizationSignatureMapper } from '@/formalization/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'
import { storedFileModel } from '@/shared/database/drizzle/models/stored-file-model'
import { randomUUID } from 'node:crypto'

const PREVIEW_SCHEDULE_CONFLICT = Symbol('PREVIEW_SCHEDULE_CONFLICT')

type ConfigurationRows = {
  readonly formalization: typeof formalizationModel.$inferSelect
  readonly signatories: readonly (typeof formalizationSignatoryModel.$inferSelect)[]
  readonly assignments: readonly (typeof formalizationSignatoryDocumentModel.$inferSelect)[]
  readonly previews: readonly (typeof formalizationSignaturePreviewModel.$inferSelect)[]
  readonly fields: readonly (typeof formalizationSignatureFieldModel.$inferSelect)[]
}

@Injectable()
export class DrizzleFormalizationSignatureConfigurationRepository
  extends DrizzleRepository
  implements FormalizationSignatureConfigurationRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureMapper,
    @Optional()
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    private readonly sourceReader?: FormalizationSignatureSourceReader,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureConfigurationRepository(
      this.drizzleClient,
      this.mapper,
      this.sourceReader,
      database,
    )
  }

  async findByFormalizationId(
    formalizationId: string,
  ): Promise<FormalizationSignatureConfiguration | null> {
    const rows = await this.loadRows(formalizationId)
    if (!rows) return null

    return this.enrichConfiguration(
      this.mapper.toConfiguration(
        rows.formalization,
        rows.signatories.map((record) => this.mapper.toSignatory(record)),
        rows.assignments.map((record) => this.mapper.toAssignment(record)),
        rows.previews.map((record) => this.mapper.toPreview(record)),
        rows.fields.map((record) => this.mapper.toField(record)),
      ),
    )
  }

  async findReadyPreviewFileId(
    formalizationId: string,
    previewId: string,
  ): Promise<string | null> {
    const [record] = await this.database
      .select({ fileId: formalizationSignaturePreviewModel.fileId })
      .from(formalizationSignaturePreviewModel)
      .where(
        and(
          eq(formalizationSignaturePreviewModel.formalizationId, formalizationId),
          eq(formalizationSignaturePreviewModel.id, previewId),
          or(
            eq(formalizationSignaturePreviewModel.state, 'ready'),
            eq(formalizationSignaturePreviewModel.state, 'stale'),
          ),
          sql`${formalizationSignaturePreviewModel.fileId} is not null`,
        ),
      )
      .limit(1)

    return record?.fileId ?? null
  }

  async replaceConfiguration(input: {
    readonly formalizationId: string
    readonly expectedFormalizationVersion: number
    readonly actorId: string
    readonly occurredAt: Date
    readonly signatories: readonly FormalizationSignatory[]
    readonly assignments: readonly FormalizationSignatoryDocument[]
    readonly fields: readonly FormalizationSignatureField[]
  }): Promise<FormalizationSignatureConfiguration | null> {
    return this.database.transaction(async (transaction) => {
      const [formalization] = await transaction
        .update(formalizationModel)
        .set({
          version: sql`${formalizationModel.version} + 1`,
          updatedAt: input.occurredAt,
        })
        .where(
          and(
            eq(formalizationModel.id, input.formalizationId),
            eq(formalizationModel.version, input.expectedFormalizationVersion),
          ),
        )
        .returning()

      if (!formalization) return null

      await transaction
        .delete(formalizationSignatureFieldModel)
        .where(
          eq(formalizationSignatureFieldModel.formalizationId, input.formalizationId),
        )
      await transaction
        .delete(formalizationSignatoryDocumentModel)
        .where(
          eq(formalizationSignatoryDocumentModel.formalizationId, input.formalizationId),
        )
      await transaction
        .delete(formalizationSignatoryModel)
        .where(eq(formalizationSignatoryModel.formalizationId, input.formalizationId))

      if (input.signatories.length > 0) {
        await transaction.insert(formalizationSignatoryModel).values(
          input.signatories.map((signatory) => ({
            id: signatory.id,
            formalizationId: signatory.formalizationId,
            personId: signatory.personId,
            role: signatory.role,
            position: signatory.position,
            selectedChannels: [...signatory.selectedChannels],
            createdByCollaboratorId: signatory.createdByCollaboratorId,
            createdAt: signatory.createdAt,
            updatedByCollaboratorId: input.actorId,
            updatedAt: input.occurredAt,
          })),
        )
      }

      if (input.assignments.length > 0) {
        await transaction.insert(formalizationSignatoryDocumentModel).values(
          input.assignments.map((assignment) => ({
            id: assignment.id,
            formalizationId: assignment.formalizationId,
            signatoryId: assignment.signatoryId,
            documentId: assignment.documentId,
            documentVersionId: assignment.documentVersionId,
            createdByCollaboratorId: assignment.createdByCollaboratorId,
            createdAt: assignment.createdAt,
          })),
        )
      }

      if (input.fields.length > 0) {
        await transaction.insert(formalizationSignatureFieldModel).values(
          input.fields.map((field) => ({
            id: field.id,
            formalizationId: field.formalizationId,
            signatoryDocumentId: field.signatoryDocumentId,
            previewId: field.previewId,
            type: field.type,
            page: field.page,
            positionX: field.positionX,
            positionY: field.positionY,
            width: field.width,
            height: field.height,
            createdByCollaboratorId: field.createdByCollaboratorId,
            createdAt: field.createdAt,
            updatedByCollaboratorId: input.actorId,
            updatedAt: input.occurredAt,
          })),
        )
      }

      const rows = await this.loadRows(input.formalizationId, transaction)
      if (!rows) throw new AppError('A configuração não pôde ser recarregada.')
      return this.enrichConfiguration(this.toConfiguration(rows))
    })
  }

  async schedulePendingPreview(
    previewId: string,
    scheduledAt: Date,
    input?: {
      readonly formalizationId: string
      readonly expectedFormalizationVersion: number
    },
  ): Promise<FormalizationSignaturePreviewClaim | null> {
    const attemptToken = randomUUID()
    const schedule = async (database: DrizzleDatabaseExecutor) => {
      const [record] = await database
        .update(formalizationSignaturePreviewModel)
        .set({
          state: 'pending',
          attemptToken,
          processingStartedAt: null,
          leaseExpiresAt: null,
          failureCode: null,
          updatedAt: scheduledAt,
        })
        .where(
          and(
            eq(formalizationSignaturePreviewModel.id, previewId),
            ...(input
              ? [
                  eq(
                    formalizationSignaturePreviewModel.formalizationId,
                    input.formalizationId,
                  ),
                ]
              : []),
            input
              ? eq(formalizationSignaturePreviewModel.state, 'failed')
              : or(
                  eq(formalizationSignaturePreviewModel.state, 'failed'),
                  eq(formalizationSignaturePreviewModel.state, 'pending'),
                  and(
                    eq(formalizationSignaturePreviewModel.state, 'processing'),
                    lte(formalizationSignaturePreviewModel.leaseExpiresAt, scheduledAt),
                  ),
                ),
          ),
        )
        .returning({
          previewId: formalizationSignaturePreviewModel.id,
          attemptToken: formalizationSignaturePreviewModel.attemptToken,
        })

      return record
    }

    let record: Awaited<ReturnType<typeof schedule>> | null | undefined
    try {
      record = input
        ? await this.database.transaction(async (transaction) => {
            const [formalization] = await transaction
              .update(formalizationModel)
              .set({
                version: sql`${formalizationModel.version} + 1`,
                updatedAt: scheduledAt,
              })
              .where(
                and(
                  eq(formalizationModel.id, input.formalizationId),
                  eq(formalizationModel.version, input.expectedFormalizationVersion),
                ),
              )
              .returning({ id: formalizationModel.id })

            if (!formalization) return null
            const scheduled = await schedule(transaction)
            if (!scheduled) throw PREVIEW_SCHEDULE_CONFLICT
            return scheduled
          })
        : await schedule(this.database)
    } catch (error) {
      if (error === PREVIEW_SCHEDULE_CONFLICT) return null
      throw error
    }

    return record?.attemptToken
      ? {
          previewId: record.previewId,
          attemptToken: record.attemptToken,
          leaseExpiresAt: scheduledAt,
        }
      : null
  }

  async claimPreview(input: {
    readonly previewId: string
    readonly attemptToken: string
    readonly claimedAt: Date
    readonly leaseExpiresAt: Date
  }): Promise<FormalizationSignaturePreviewClaim | null> {
    const [record] = await this.database
      .update(formalizationSignaturePreviewModel)
      .set({
        state: 'processing',
        processingStartedAt: input.claimedAt,
        leaseExpiresAt: input.leaseExpiresAt,
        attemptsCount: sql`${formalizationSignaturePreviewModel.attemptsCount} + 1`,
        updatedAt: input.claimedAt,
      })
      .where(
        and(
          eq(formalizationSignaturePreviewModel.id, input.previewId),
          eq(formalizationSignaturePreviewModel.attemptToken, input.attemptToken),
          or(
            eq(formalizationSignaturePreviewModel.state, 'pending'),
            eq(formalizationSignaturePreviewModel.state, 'processing'),
          ),
        ),
      )
      .returning({
        previewId: formalizationSignaturePreviewModel.id,
        attemptToken: formalizationSignaturePreviewModel.attemptToken,
        leaseExpiresAt: formalizationSignaturePreviewModel.leaseExpiresAt,
      })

    return record?.attemptToken && record.leaseExpiresAt
      ? {
          previewId: record.previewId,
          attemptToken: record.attemptToken,
          leaseExpiresAt: record.leaseExpiresAt,
        }
      : null
  }

  async finalizePreview(input: {
    readonly preview: FormalizationSignaturePreview
    readonly attemptToken: string
    readonly leaseExpiresAt: Date
  }): Promise<boolean> {
    if (!input.preview.fileId) return false

    const [record] = await this.database
      .update(formalizationSignaturePreviewModel)
      .set({
        fileId: input.preview.fileId,
        contentChecksumSha256: input.preview.contentChecksumSha256 ?? null,
        pdfChecksumSha256: input.preview.pdfChecksumSha256 ?? null,
        converterVersion: input.preview.converterVersion ?? null,
        pageCount: input.preview.pageCount ?? null,
        pages: [...input.preview.pages],
        byteSize: input.preview.byteSize ?? null,
        state: input.preview.state,
        attemptToken: null,
        processingStartedAt: null,
        leaseExpiresAt: null,
        failureCode: null,
        updatedAt: input.preview.updatedAt,
      })
      .where(
        and(
          eq(formalizationSignaturePreviewModel.id, input.preview.id),
          eq(formalizationSignaturePreviewModel.state, 'processing'),
          eq(formalizationSignaturePreviewModel.attemptToken, input.attemptToken),
          eq(formalizationSignaturePreviewModel.leaseExpiresAt, input.leaseExpiresAt),
        ),
      )
      .returning({ id: formalizationSignaturePreviewModel.id })

    return Boolean(record)
  }

  async failPreview(input: {
    readonly previewId: string
    readonly attemptToken: string
    readonly failureCode: NonNullable<FormalizationSignaturePreview['failureCode']>
    readonly failedAt: Date
  }): Promise<boolean> {
    const [record] = await this.database
      .update(formalizationSignaturePreviewModel)
      .set({
        state: 'failed',
        failureCode: input.failureCode,
        attemptToken: null,
        processingStartedAt: null,
        leaseExpiresAt: null,
        updatedAt: input.failedAt,
      })
      .where(
        and(
          eq(formalizationSignaturePreviewModel.id, input.previewId),
          eq(formalizationSignaturePreviewModel.state, 'processing'),
          eq(formalizationSignaturePreviewModel.attemptToken, input.attemptToken),
        ),
      )
      .returning({ id: formalizationSignaturePreviewModel.id })

    return Boolean(record)
  }

  async listPendingPreviews(
    limit: number,
  ): Promise<readonly FormalizationSignaturePreview[]> {
    const records = await this.database
      .select()
      .from(formalizationSignaturePreviewModel)
      .where(eq(formalizationSignaturePreviewModel.state, 'pending'))
      .orderBy(asc(formalizationSignaturePreviewModel.updatedAt))
      .limit(limit)

    return records.map((record) => this.mapper.toPreview(record))
  }

  async listExpiredPreviews(
    limit: number,
    now: Date,
  ): Promise<readonly FormalizationSignaturePreview[]> {
    const records = await this.database
      .select()
      .from(formalizationSignaturePreviewModel)
      .where(
        and(
          eq(formalizationSignaturePreviewModel.state, 'processing'),
          lte(formalizationSignaturePreviewModel.leaseExpiresAt, now),
        ),
      )
      .orderBy(asc(formalizationSignaturePreviewModel.leaseExpiresAt))
      .limit(limit)

    return records.map((record) => this.mapper.toPreview(record))
  }

  async listCleanupCandidates(
    limit: number,
  ): Promise<readonly FormalizationSignaturePreviewCleanupCandidate[]> {
    const records = await this.database
      .select({
        previewId: formalizationSignaturePreviewModel.id,
        fileId: formalizationSignaturePreviewModel.fileId,
      })
      .from(formalizationSignaturePreviewModel)
      .where(
        and(
          eq(formalizationSignaturePreviewModel.state, 'cleanup_pending'),
          sql`${formalizationSignaturePreviewModel.fileId} is not null`,
        ),
      )
      .orderBy(asc(formalizationSignaturePreviewModel.updatedAt))
      .limit(limit)

    return records.flatMap((record) =>
      record.fileId ? [{ previewId: record.previewId, fileId: record.fileId }] : [],
    )
  }

  async markCleanupComplete(input: {
    readonly previewId: string
    readonly fileId: string
  }): Promise<boolean> {
    return this.database.transaction(async (transaction) => {
      const deleted = await transaction
        .delete(formalizationSignaturePreviewModel)
        .where(
          and(
            eq(formalizationSignaturePreviewModel.id, input.previewId),
            eq(formalizationSignaturePreviewModel.fileId, input.fileId),
            eq(formalizationSignaturePreviewModel.state, 'cleanup_pending'),
          ),
        )
        .returning({ id: formalizationSignaturePreviewModel.id })

      if (deleted.length === 0) return false
      await transaction
        .delete(storedFileModel)
        .where(eq(storedFileModel.id, input.fileId))
      return true
    })
  }

  private async loadRows(
    formalizationId: string,
    database: DrizzleDatabaseExecutor = this.database,
  ): Promise<ConfigurationRows | null> {
    const [formalization] = await database
      .select()
      .from(formalizationModel)
      .where(eq(formalizationModel.id, formalizationId))
      .limit(1)
    if (!formalization) return null

    const [signatories, assignments, previews, fields] = await Promise.all([
      database
        .select()
        .from(formalizationSignatoryModel)
        .where(eq(formalizationSignatoryModel.formalizationId, formalizationId))
        .orderBy(asc(formalizationSignatoryModel.position)),
      database
        .select()
        .from(formalizationSignatoryDocumentModel)
        .where(eq(formalizationSignatoryDocumentModel.formalizationId, formalizationId))
        .orderBy(asc(formalizationSignatoryDocumentModel.createdAt)),
      database
        .select()
        .from(formalizationSignaturePreviewModel)
        .where(
          and(
            eq(formalizationSignaturePreviewModel.formalizationId, formalizationId),
            sql`${formalizationSignaturePreviewModel.state} <> 'cleanup_pending'`,
          ),
        )
        .orderBy(asc(formalizationSignaturePreviewModel.documentId)),
      database
        .select()
        .from(formalizationSignatureFieldModel)
        .where(eq(formalizationSignatureFieldModel.formalizationId, formalizationId))
        .orderBy(asc(formalizationSignatureFieldModel.createdAt)),
    ])

    return { formalization, signatories, assignments, previews, fields }
  }

  private toConfiguration(rows: ConfigurationRows) {
    return this.mapper.toConfiguration(
      rows.formalization,
      rows.signatories.map((record) => this.mapper.toSignatory(record)),
      rows.assignments.map((record) => this.mapper.toAssignment(record)),
      rows.previews.map((record) => this.mapper.toPreview(record)),
      rows.fields.map((record) => this.mapper.toField(record)),
    )
  }

  private async enrichConfiguration(
    configuration: FormalizationSignatureConfiguration,
  ): Promise<FormalizationSignatureConfiguration> {
    if (!this.sourceReader) return configuration

    const [people, documents] = await Promise.all([
      Promise.all(
        configuration.signatories.map((signatory) =>
          this.sourceReader?.findPerson(signatory.personId),
        ),
      ),
      this.sourceReader.listCurrentDocuments(configuration.formalizationId),
    ])
    const peopleById = new Map(
      people.flatMap((person) => (person ? [[person.personId, person] as const] : [])),
    )
    const documentsById = new Map(
      documents.map((document) => [document.documentId, document]),
    )

    return this.mapper.refreshDerivedState({
      ...configuration,
      ...{
        signatories: configuration.signatories.map((signatory) => {
          const person = peopleById.get(signatory.personId)
          return person
            ? {
                ...signatory,
                name: person.name,
                profile:
                  person.profile === 'lawyer' ||
                  person.profile === 'paralegal' ||
                  person.profile === 'supervisor'
                    ? person.profile
                    : undefined,
                availableChannels: [...person.availableChannels],
              }
            : signatory
        }),
        documents: configuration.documents.map((document) => {
          const source = documentsById.get(document.documentId)
          return source
            ? {
                ...document,
                name: source.name,
                reviewStatus: source.reviewStatus,
              }
            : document
        }),
      },
    })
  }
}
