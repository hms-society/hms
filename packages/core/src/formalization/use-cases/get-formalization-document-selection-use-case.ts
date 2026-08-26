import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import { DocumentGenerationMoment, DocumentSpecificationStatus } from '../../document-production/domain/structures'
import type { UseCase } from '../../shared/interfaces'
import type { FormalizationDocumentSelection } from '../domain/structures'
import { FormalizationNotFoundError } from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationSourceReader, FormalizationsRepository } from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'
import { FormalizationDocumentGuard } from './formalization-document-guard'

type Request = FormalizationActor & {
  readonly formalizationId: string
}

export class GetFormalizationDocumentSelectionUseCase
  implements UseCase<Request, FormalizationDocumentSelection>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly sourceReader: FormalizationSourceReader,
    private readonly specificationsRepository: DocumentSpecificationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentVersionsRepository: DocumentVersionsRepository,
  ) {}

  async execute(request: Request): Promise<FormalizationDocumentSelection> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    FormalizationDocumentGuard.assertFormClosed(formalization)
    const context = await this.sourceReader.findContext(formalization)
    if (!context) throw new FormalizationNotFoundError()
    const specifications = await this.specificationsRepository.list({
      moment: DocumentGenerationMoment.Formalization,
      status: DocumentSpecificationStatus.Available,
      ...(context.intake.legalAreaId ? { legalAreaId: context.intake.legalAreaId } : {}),
      ...(context.intake.legalTopicId ? { legalTopicId: context.intake.legalTopicId } : {}),
    })
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    const packageDocuments = documentPackage
      ? await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
      : []
    const documentIds = packageDocuments.map((document) => document.documentId)
    const versions = await this.documentVersionsRepository.findByDocumentIds(documentIds)
    const versionedDocumentIds = new Set(versions.map((version) => version.documentId))
    const selectedSpecificationIds = new Set(
      packageDocuments.map((document) => document.documentSpecificationId),
    )

    return {
      options: specifications.items.map((specification) => ({
        documentSpecificationId: specification.documentSpecificationId,
        name: specification.name,
        description: specification.description,
        application: specification.application,
        status: DocumentSpecificationStatus.Available,
        selected: selectedSpecificationIds.has(specification.documentSpecificationId),
        hasVersion: packageDocuments.some(
          (document) =>
            document.documentSpecificationId === specification.documentSpecificationId &&
            versionedDocumentIds.has(document.documentId),
        ),
      })),
      selectedDocumentSpecificationIds: [...selectedSpecificationIds],
      ...(documentPackage?.confirmedAt
        ? {
            confirmedAt: documentPackage.confirmedAt,
            confirmedByCollaboratorId: documentPackage.confirmedByCollaboratorId,
          }
        : {}),
    }
  }
}
