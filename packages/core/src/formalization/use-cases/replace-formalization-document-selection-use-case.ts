import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import type { PackageDocument } from '../../document-production/domain/entities'
import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '../../document-production/domain/structures'
import type { DatetimeProvider, IdProvider } from '../../shared/interfaces'
import type { FormalizationDocumentSelection } from '../domain/structures'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationSourceReader, FormalizationsRepository } from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'
import { GetFormalizationDocumentSelectionUseCase } from './get-formalization-document-selection-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly documentSpecificationIds: readonly string[]
}

export class ReplaceFormalizationDocumentSelectionUseCase extends FormalizationUseCase<
  Request,
  FormalizationDocumentSelection
> {
  private readonly getSelectionUseCase: GetFormalizationDocumentSelectionUseCase

  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    sourceReader: FormalizationSourceReader,
    private readonly specificationsRepository: DocumentSpecificationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly documentVersionsRepository: DocumentVersionsRepository,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {
    super()
    this.getSelectionUseCase = new GetFormalizationDocumentSelectionUseCase(
      formalizationsRepository,
      sourceReader,
      specificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentVersionsRepository,
    )
  }

  async execute(request: Request): Promise<FormalizationDocumentSelection> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    this.assertWritable(formalization)
    if (formalization.documentsConfirmedAt) {
      throw new FormalizationStateConflictError(
        'Reabra a confirmação antes de alterar a seleção.',
      )
    }

    const selection = await this.getSelectionUseCase.execute(request)
    const allowedIds = new Set(
      selection.options.map((option) => option.documentSpecificationId),
    )
    const selectedIds = [...new Set(request.documentSpecificationIds)]
    if (selectedIds.some((id) => !allowedIds.has(id))) {
      throw new FormalizationStateConflictError(
        'Um ou mais modelos não estão disponíveis para esta formalização.',
      )
    }

    const documentPackage =
      (await this.documentPackagesRepository.findByContext({
        type: 'formalization',
        formalizationId: formalization.id,
      })) ??
      (await this.documentPackagesRepository.add({
        id: this.idProvider.generate(),
        context: { type: 'formalization', formalizationId: formalization.id },
      }))
    const current = await this.packageDocumentsRepository.findByDocumentPackageId(
      documentPackage.id,
    )
    const currentBySpecification = new Map(
      current.map((document) => [document.documentSpecificationId, document]),
    )
    const versions = await this.documentVersionsRepository.findByDocumentIds(
      current.map((document) => document.documentId),
    )
    const versionedIds = new Set(versions.map((version) => version.documentId))
    if (
      current.some(
        (document) =>
          !selectedIds.includes(document.documentSpecificationId) &&
          versionedIds.has(document.documentId),
      )
    ) {
      throw new FormalizationStateConflictError(
        'Documentos com versões associadas não podem ser removidos da seleção.',
      )
    }

    const now = this.datetimeProvider.now()
    const specifications = await this.specificationsRepository.list({
      moment: DocumentGenerationMoment.Formalization,
      status: DocumentSpecificationStatus.Available,
    })
    const specificationsById = new Map(
      specifications.items.map((specification) => [
        specification.documentSpecificationId,
        specification,
      ]),
    )
    const packageDocuments: PackageDocument[] = []
    for (const specificationId of selectedIds) {
      const existing = currentBySpecification.get(specificationId)
      if (existing) {
        packageDocuments.push(existing)
        continue
      }
      const specification = specificationsById.get(specificationId)
      if (!specification)
        throw new FormalizationStateConflictError('Modelo indisponível.')
      const document = await this.documentsRepository.add({
        id: this.idProvider.generate(),
        title: specification.name,
        classificacaoAcesso: 'INTERNO',
      })
      packageDocuments.push({
        id: this.idProvider.generate(),
        documentPackageId: documentPackage.id,
        documentId: document.id,
        documentSpecificationId: specificationId,
        createdAt: now,
        updatedAt: now,
      })
    }
    await this.packageDocumentsRepository.replaceForDocumentPackage(
      documentPackage.id,
      packageDocuments,
    )
    return this.getSelectionUseCase.execute(request)
  }
}
