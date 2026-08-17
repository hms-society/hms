import type { UseCase } from '#shared/interfaces'
import type { ConsultationDocumentSelection } from '../domain/structures'
import type { DocumentSpecificationListRecord } from '../../document-production/domain/structures'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationNotFoundError,
} from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
}

function isApplicableToConsultation(
  application: DocumentSpecificationListRecord['application'],
  legalAreaId: string,
  legalTopicId: string,
) {
  if (application.scope === 'global') return true
  return (
    application.legalAreaIds.includes(legalAreaId) &&
    application.legalTopicIdsByArea[legalAreaId]?.includes(legalTopicId) === true
  )
}

export class GetConsultationDocumentSelectionUseCase
  implements UseCase<Request, ConsultationDocumentSelection>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentSpecificationsRepository: DocumentSpecificationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentVersionsRepository: DocumentVersionsRepository,
  ) {}

  async execute(request: Request): Promise<ConsultationDocumentSelection> {
    const consultation = await this.loadConsultation(request)
    const [specificationsPage, documentPackage] = await Promise.all([
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
    const packageDocuments = documentPackage
      ? await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
      : []
    const documentVersions = await this.documentVersionsRepository.findByDocumentIds(
      packageDocuments.map(({ documentId }) => documentId),
    )
    const documentIdsWithVersions = new Set(
      documentVersions.map(({ documentId }) => documentId),
    )
    const selectedIds = new Set(
      packageDocuments.map(({ documentSpecificationId }) => documentSpecificationId),
    )
    const documentIdsBySpecification = new Map(
      packageDocuments.map(({ documentId, documentSpecificationId }) => [
        documentSpecificationId,
        documentId,
      ]),
    )

    return {
      options: specificationsPage.items
        .filter((specification) =>
          isApplicableToConsultation(
            specification.application,
            consultation.legalAreaId,
            consultation.legalTopicId,
          ),
        )
        .map((specification) => ({
          ...specification,
          selected: selectedIds.has(specification.documentSpecificationId),
          hasVersion: documentIdsWithVersions.has(
            documentIdsBySpecification.get(specification.documentSpecificationId) ?? '',
          ),
        })),
      selectedDocumentSpecificationIds: packageDocuments.map(
        ({ documentSpecificationId }) => documentSpecificationId,
      ),
    }
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
