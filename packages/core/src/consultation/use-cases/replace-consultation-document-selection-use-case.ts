import type { IdProvider, UseCase } from '#shared/interfaces'
import type {
  DocumentPackageCreation,
  PackageDocumentCreation,
} from '../../document-production/domain/entities'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationNotFoundError,
  ConsultationPackageConfirmationError,
  ConsultationDocumentSelectionRemovalError,
  InvalidConsultationDocumentSelectionError,
} from '../domain/errors'
import type { ConsultationDocumentSelection } from '../domain/structures'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
  readonly documentSpecificationIds: readonly string[]
}

export class ReplaceConsultationDocumentSelectionUseCase
  implements UseCase<Request, ConsultationDocumentSelection>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentSpecificationsRepository: DocumentSpecificationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly documentVersionsRepository: DocumentVersionsRepository,
    private readonly idProvider: IdProvider,
  ) {}

  async execute(request: Request): Promise<ConsultationDocumentSelection> {
    const consultation = await this.loadConsultation(request)
    const [specificationsPage, existingPackage] = await Promise.all([
      this.documentSpecificationsRepository.list({
        moment: 'consultation',
        status: 'available',
        page: 1,
        pageSize: 100,
      }),
      this.documentPackagesRepository.findByContext({
        type: 'consultation',
        consultationId: consultation.id,
      }),
    ])
    const availableSpecifications = specificationsPage.items
    if (existingPackage?.confirmedAt) {
      throw new ConsultationPackageConfirmationError(
        'O pacote de documentos já foi confirmado e não pode mais ser alterado.',
      )
    }
    const selectedIds = [...new Set(request.documentSpecificationIds)]
    const specificationsById = new Map(
      availableSpecifications.map((specification) => [
        specification.documentSpecificationId,
        specification,
      ]),
    )
    if (selectedIds.some((id) => !specificationsById.has(id))) {
      throw new InvalidConsultationDocumentSelectionError()
    }

    const currentPackageDocuments = existingPackage
      ? await this.packageDocumentsRepository.findByDocumentPackageId(existingPackage.id)
      : []
    const documentVersions = await this.documentVersionsRepository.findByDocumentIds(
      currentPackageDocuments.map(({ documentId }) => documentId),
    )
    const documentIdsWithVersions = new Set(
      documentVersions.map(({ documentId }) => documentId),
    )
    const lockedDocumentSpecificationIds = new Set(
      currentPackageDocuments
        .filter(({ documentId }) => documentIdsWithVersions.has(documentId))
        .map(({ documentSpecificationId }) => documentSpecificationId),
    )
    if (
      [...lockedDocumentSpecificationIds].some(
        (documentSpecificationId) => !selectedIds.includes(documentSpecificationId),
      )
    ) {
      throw new ConsultationDocumentSelectionRemovalError()
    }

    const documentPackage =
      existingPackage ??
      (await this.documentPackagesRepository.add({
        id: this.idProvider.generate(),
        context: { type: 'consultation', consultationId: consultation.id },
      } satisfies DocumentPackageCreation))
    const currentDocumentBySpecification = new Map(
      currentPackageDocuments.map((packageDocument) => [
        packageDocument.documentSpecificationId,
        packageDocument.documentId,
      ]),
    )
    const packageDocumentCreations: PackageDocumentCreation[] = []

    for (const documentSpecificationId of selectedIds) {
      const specification = specificationsById.get(documentSpecificationId)
      if (!specification) throw new InvalidConsultationDocumentSelectionError()
      const documentId = await this.resolveDocumentId(
        specification.name,
        currentDocumentBySpecification.get(documentSpecificationId),
      )
      packageDocumentCreations.push({
        id: this.idProvider.generate(),
        documentPackageId: documentPackage.id,
        documentId,
        documentSpecificationId,
      })
    }

    await this.packageDocumentsRepository.replaceForDocumentPackage(
      documentPackage.id,
      packageDocumentCreations,
    )

    return {
      options: availableSpecifications.map((specification) => ({
        ...specification,
        selected: selectedIds.includes(specification.documentSpecificationId),
        hasVersion: documentIdsWithVersions.has(
          currentDocumentBySpecification.get(specification.documentSpecificationId) ?? '',
        ),
      })),
      selectedDocumentSpecificationIds: selectedIds,
      confirmedAt: documentPackage.confirmedAt,
      confirmedByCollaboratorId: documentPackage.confirmedByCollaboratorId,
    }
  }

  private async resolveDocumentId(title: string, currentDocumentId?: string) {
    if (currentDocumentId) return currentDocumentId
    const document = await this.documentsRepository.add({
      id: this.idProvider.generate(),
      title,
      classificacaoAcesso: 'INTERNO',
    })
    return document.id
  }

  private async loadConsultation(request: Request) {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.collaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.collaboratorId
    ) {
      throw new ConsultationDocumentAccessDeniedError()
    }
    return consultation
  }
}
