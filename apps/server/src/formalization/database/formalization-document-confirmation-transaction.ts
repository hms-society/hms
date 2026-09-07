import { Inject, Injectable } from '@nestjs/common'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
  FormalizationVersionConflictError,
} from '@hms/core/formalization/domain/errors'
import type { FormalizationDocumentConfirmationTransaction } from '@hms/core/formalization/interfaces'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { DocumentVersionStatus } from '@hms/core/document-production/domain/structures'
import { and, eq, inArray, not } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import {
  formalizationSignaturePreviewModel,
  formalizationSignatureFieldModel,
  formalizationSignatoryModel,
} from '@/formalization/database/drizzle/models'
import { DrizzleFormalizationsRepository } from '@/formalization/database/drizzle/repositories'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { DrizzleDatabaseExecutor } from '@/shared/database/drizzle/drizzle-repository'

type TransactionalFormalizationsRepository = DrizzleFormalizationsRepository & {
  withDatabase(database: DrizzleDatabaseExecutor): DrizzleFormalizationsRepository
}

@Injectable()
export class DrizzleFormalizationDocumentConfirmationTransaction
  implements FormalizationDocumentConfirmationTransaction
{
  constructor(
    private readonly drizzleClient: DrizzleClient,
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: TransactionalFormalizationsRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    private readonly documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    private readonly documentVersionsRepository: DocumentVersionsRepository,
  ) {}

  confirm(input: {
    readonly formalizationId: string
    readonly expectedVersion: number
    readonly actorId: string
    readonly occurredAt: Date
  }) {
    return this.execute(input, true)
  }

  initializeConfirmed(input: {
    readonly formalizationId: string
    readonly expectedVersion: number
    readonly actorId: string
    readonly occurredAt: Date
  }) {
    return this.execute(input, false)
  }

  reopen(input: {
    readonly formalizationId: string
    readonly expectedVersion: number
    readonly occurredAt: Date
  }) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const formalizationsRepository =
        this.formalizationsRepository.withDatabase(transaction)
      const existing = await formalizationsRepository.findById(input.formalizationId)

      if (!existing) throw new FormalizationNotFoundError()
      if (!existing.documentsConfirmedAt) return existing
      if (existing.status !== 'in_progress') {
        throw new FormalizationStateConflictError(
          'A formalização não pode ser reaberta neste estado.',
        )
      }

      const documentPackage = await this.documentPackagesRepository.findByContext({
        type: 'formalization',
        formalizationId: input.formalizationId,
      })

      if (!documentPackage) {
        throw new FormalizationStateConflictError(
          'A formalização não possui um pacote documental confirmado.',
        )
      }

      await this.documentPackagesRepository.reopen(documentPackage.id, input.occurredAt)

      const reopened = await formalizationsRepository.replace({
        formalizationId: input.formalizationId,
        expectedVersion: input.expectedVersion,
        changes: {
          documentsConfirmedAt: undefined,
          documentsConfirmedByCollaboratorId: undefined,
          documentsConfirmedRevision: undefined,
        },
      })
      if (!reopened) throw new FormalizationVersionConflictError()
      return reopened
    })
  }

  private execute(
    input: {
      readonly formalizationId: string
      readonly expectedVersion: number
      readonly actorId: string
      readonly occurredAt: Date
    },
    shouldConfirm: boolean,
  ) {
    return this.drizzleClient.requireDatabase().transaction(async (transaction) => {
      const formalizationsRepository =
        this.formalizationsRepository.withDatabase(transaction)
      const existing = await formalizationsRepository.findById(input.formalizationId)

      if (!existing) throw new FormalizationNotFoundError()

      const client = await this.clientsRepository.findById(existing.clientId)
      if (client?.type !== 'natural') {
        throw new FormalizationStateConflictError(
          'A configuração de assinatura exige um cliente pessoa natural.',
        )
      }

      let formalization = existing
      if (shouldConfirm) {
        const confirmed = await formalizationsRepository.replace({
          formalizationId: input.formalizationId,
          expectedVersion: input.expectedVersion,
          changes: {
            documentsConfirmedAt: input.occurredAt,
            documentsConfirmedByCollaboratorId: input.actorId,
            documentsConfirmedRevision: existing.contractFormRevision,
          },
        })
        if (!confirmed) throw new FormalizationVersionConflictError()
        formalization = confirmed
      } else if (
        !existing.documentsConfirmedAt ||
        !existing.documentsConfirmedByCollaboratorId
      ) {
        throw new FormalizationStateConflictError(
          'A formalização precisa estar confirmada para inicializar as assinaturas.',
        )
      }

      const documentPackage = await this.documentPackagesRepository.findByContext({
        type: 'formalization',
        formalizationId: input.formalizationId,
      })

      if (!documentPackage) {
        throw new FormalizationStateConflictError(
          'A formalização não possui um pacote documental.',
        )
      }

      const currentDocuments = await this.loadCurrentDocuments(documentPackage.id)

      if (!shouldConfirm) {
        await this.documentPackagesRepository.confirm(
          documentPackage.id,
          input.actorId,
          input.occurredAt,
        )
      }

      const existingSignatories = await transaction
        .select()
        .from(formalizationSignatoryModel)
        .where(eq(formalizationSignatoryModel.formalizationId, input.formalizationId))

      if (existingSignatories.length === 0) {
        await transaction.insert(formalizationSignatoryModel).values([
          {
            id: randomUUID(),
            formalizationId: input.formalizationId,
            personId: formalization.clientId,
            role: 'client',
            position: 1,
            createdByCollaboratorId: input.actorId,
            updatedByCollaboratorId: input.actorId,
            createdAt: input.occurredAt,
            updatedAt: input.occurredAt,
          },
          {
            id: randomUUID(),
            formalizationId: input.formalizationId,
            personId: formalization.assignedLawyerId,
            role: 'responsible_lawyer',
            position: 2,
            createdByCollaboratorId: input.actorId,
            updatedByCollaboratorId: input.actorId,
            createdAt: input.occurredAt,
            updatedAt: input.occurredAt,
          },
        ])
      }

      const currentKeys = new Set(
        currentDocuments.map(
          ({ documentId, documentVersionId }) => `${documentId}:${documentVersionId}`,
        ),
      )
      const existingPreviews = await transaction
        .select()
        .from(formalizationSignaturePreviewModel)
        .where(
          eq(formalizationSignaturePreviewModel.formalizationId, input.formalizationId),
        )

      for (const preview of existingPreviews) {
        const isCurrent = currentKeys.has(
          `${preview.documentId}:${preview.documentVersionId}`,
        )
        if (isCurrent || preview.state === 'cleanup_pending') continue

        if (preview.fileId) {
          await transaction
            .update(formalizationSignaturePreviewModel)
            .set({
              state: 'cleanup_pending',
              updatedAt: input.occurredAt,
              attemptToken: null,
              processingStartedAt: null,
              leaseExpiresAt: null,
            })
            .where(eq(formalizationSignaturePreviewModel.id, preview.id))
        } else {
          await transaction
            .delete(formalizationSignatureFieldModel)
            .where(eq(formalizationSignatureFieldModel.previewId, preview.id))
          await transaction
            .delete(formalizationSignaturePreviewModel)
            .where(eq(formalizationSignaturePreviewModel.id, preview.id))
        }
      }

      const currentPreviewRows = await transaction
        .select()
        .from(formalizationSignaturePreviewModel)
        .where(
          and(
            eq(formalizationSignaturePreviewModel.formalizationId, input.formalizationId),
            inArray(
              formalizationSignaturePreviewModel.documentVersionId,
              currentDocuments.map(({ documentVersionId }) => documentVersionId),
            ),
            not(eq(formalizationSignaturePreviewModel.state, 'stale')),
            not(eq(formalizationSignaturePreviewModel.state, 'cleanup_pending')),
          ),
        )

      const currentPreviewKeys = new Set(
        currentPreviewRows.map(
          ({ documentId, documentVersionId }) => `${documentId}:${documentVersionId}`,
        ),
      )
      const newPreviews = currentDocuments.filter(
        ({ documentId, documentVersionId }) =>
          !currentPreviewKeys.has(`${documentId}:${documentVersionId}`),
      )

      if (newPreviews.length > 0) {
        await transaction.insert(formalizationSignaturePreviewModel).values(
          newPreviews.map(({ documentId, documentVersionId }) => ({
            id: randomUUID(),
            formalizationId: input.formalizationId,
            documentId,
            documentVersionId,
            pages: [],
            state: 'pending' as const,
            attemptsCount: 0,
            attemptToken: randomUUID(),
            createdAt: input.occurredAt,
            updatedAt: input.occurredAt,
          })),
        )
      }

      const pendingRows = await transaction
        .select({ id: formalizationSignaturePreviewModel.id })
        .from(formalizationSignaturePreviewModel)
        .where(
          and(
            eq(formalizationSignaturePreviewModel.formalizationId, input.formalizationId),
            eq(formalizationSignaturePreviewModel.state, 'pending'),
          ),
        )

      return {
        formalization,
        pendingPreviewIds: pendingRows.map(({ id }) => id),
      }
    })
  }

  private async loadCurrentDocuments(documentPackageId: string) {
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackageId)
    const documentIds = packageDocuments.map(({ documentId }) => documentId)
    const [documents, versions] = await Promise.all([
      this.documentsRepository.findByIds(documentIds),
      this.documentVersionsRepository.findByDocumentIds(documentIds),
    ])
    const versionsById = new Map(versions.map((version) => [version.id, version]))

    return packageDocuments.flatMap(({ documentId }) => {
      const document = documents.find(({ id }) => id === documentId)
      const documentVersions = versions.filter(
        (version) => version.documentId === documentId,
      )
      const version = document?.currentVersionId
        ? versionsById.get(document.currentVersionId)
        : documentVersions.reduce<(typeof documentVersions)[number] | undefined>(
            (latest, candidate) =>
              !latest || candidate.versionNumber > latest.versionNumber
                ? candidate
                : latest,
            undefined,
          )
      if (version?.status !== DocumentVersionStatus.Approved) return []
      return [{ documentId, documentVersionId: version.id }]
    })
  }
}
