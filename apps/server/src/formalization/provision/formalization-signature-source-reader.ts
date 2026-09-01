import { Inject, Injectable } from '@nestjs/common'
import type {
  CollaboratorsRepository,
  ClientsRepository,
} from '@hms/core/identity/interfaces'
import type {
  DocumentsRepository,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type {
  FormalizationSignatureCandidatePage,
  FormalizationSignatureSourceDocument,
  FormalizationSignatureSourcePerson,
} from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureSourceReader as FormalizationSignatureSourceReaderContract } from '@hms/core/formalization/interfaces'
import type { CommunicationChannel } from '@hms/core/communication/domain/structures'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

const ELIGIBLE_PROFILES = ['lawyer', 'paralegal', 'supervisor'] as const

@Injectable()
export class FormalizationSignatureSourceReader
  implements FormalizationSignatureSourceReaderContract
{
  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    private readonly documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    private readonly versionsRepository: DocumentVersionsRepository,
  ) {}

  async findPerson(personId: string): Promise<FormalizationSignatureSourcePerson | null> {
    const client = await this.clientsRepository.findById(personId)
    if (client) {
      const name = client.type === 'natural' ? client.name : client.legalName
      return {
        personId: client.id,
        name,
        type: client.type,
        email: client.email,
        phone: client.phone,
        availableChannels: this.getAvailableChannels(client.email, client.phone),
      }
    }

    const collaborator = await this.collaboratorsRepository.findSummaryById(personId)
    if (!collaborator) return null

    return {
      personId: collaborator.collaboratorId,
      name: collaborator.professionalName,
      profile: collaborator.profile,
      email: collaborator.email,
      availableChannels: this.getAvailableChannels(collaborator.email),
    }
  }

  async listEligibleCandidates(input: {
    readonly formalizationId: string
    readonly page: number
    readonly limit: number
    readonly search?: string
    readonly excludedPersonIds: readonly string[]
  }): Promise<FormalizationSignatureCandidatePage> {
    const result = await this.collaboratorsRepository.list({
      page: input.page,
      limit: input.limit,
      search: input.search,
      profiles: ELIGIBLE_PROFILES,
    } as Parameters<CollaboratorsRepository['list']>[0])
    const excluded = new Set(input.excludedPersonIds)
    const items = result.items.flatMap((collaborator) => {
      if (
        !ELIGIBLE_PROFILES.includes(
          collaborator.profile as (typeof ELIGIBLE_PROFILES)[number],
        )
      ) {
        return []
      }
      if (excluded.has(collaborator.collaboratorId)) return []

      return [
        {
          collaboratorId: collaborator.collaboratorId,
          name: collaborator.professionalName,
          profile: collaborator.profile as (typeof ELIGIBLE_PROFILES)[number],
          email: collaborator.email,
          availableChannels: this.getAvailableChannels(collaborator.email),
        },
      ]
    })

    return {
      items,
      page: result.page,
      limit: result.pageSize,
      total: result.total,
    }
  }

  async listCurrentDocuments(
    formalizationId: string,
  ): Promise<ReadonlyArray<FormalizationSignatureSourceDocument>> {
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId,
    })
    if (!documentPackage) return []

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    const documents = await this.documentsRepository.findByIds(
      packageDocuments.map(({ documentId }) => documentId),
    )
    const versions = await this.versionsRepository.findByDocumentIds(
      documents.map(({ id }) => id),
    )
    const documentsById = new Map(documents.map((document) => [document.id, document]))
    const versionsById = new Map(versions.map((version) => [version.id, version]))

    return packageDocuments.flatMap(({ documentId }) => {
      const document = documentsById.get(documentId)
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
      if (!document || !version) return []

      return [
        {
          documentId: document.id,
          documentVersionId: version.id,
          name: document.title,
          reviewStatus: version.status,
          fileId: version.fileId,
        },
      ]
    })
  }

  async findCurrentDocument(
    formalizationId: string,
    documentId: string,
  ): Promise<FormalizationSignatureSourceDocument | null> {
    const document = (await this.listCurrentDocuments(formalizationId)).find(
      ({ documentId: currentDocumentId }) => currentDocumentId === documentId,
    )
    return document ?? null
  }

  async findDocumentVersion(
    formalizationId: string,
    documentVersionId: string,
  ): Promise<FormalizationSignatureSourceDocument | null> {
    const document = (await this.listCurrentDocuments(formalizationId)).find(
      ({ documentVersionId: currentVersionId }) => currentVersionId === documentVersionId,
    )
    return document ?? null
  }

  private getAvailableChannels(email?: string, phone?: string): CommunicationChannel[] {
    return [
      ...(email ? (['email'] as const) : []),
      ...(phone ? (['whatsapp'] as const) : []),
    ]
  }
}
