import { Inject, Injectable } from '@nestjs/common'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import {
  CancelFormalizationDocumentGenerationUseCase,
  CloseFormalizationContractFormUseCase,
  CloseFormalizationWithoutContractUseCase,
  ConfirmFormalizationDocumentsUseCase,
  GenerateFormalizationDocumentUseCase,
  GetFormalizationDocumentSelectionUseCase,
  GetFormalizationDocumentVersionUseCase,
  GetFormalizationUseCase,
  ListFormalizationDocumentsUseCase,
  ReopenFormalizationContractFormUseCase,
  ReplaceFormalizationContractFormUseCase,
  ReplaceFormalizationDocumentSelectionUseCase,
  ReviewFormalizationDocumentVersionUseCase,
  SaveFormalizationContractFormDraftUseCase,
  SaveManualFormalizationDocumentVersionUseCase,
  SelectCurrentFormalizationDocumentVersionUseCase,
  StartFormalizationUseCase,
} from '@hms/core/formalization/use-cases'
import type {
  FormalizationsRepository,
  FormalizationIntakeClosureService,
  FormalizationIntakeLifecycleService,
  FormalizationSourceReader,
} from '@hms/core/formalization/interfaces'
import type {
  DocumentFileExporter,
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import { FormalizationStateConflictError } from '@hms/core/formalization/domain/errors'
import { FormalizationStatus } from '@hms/core/formalization/domain/structures'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import {
  ServerFormalizationIntakeClosureService,
  ServerFormalizationIntakeLifecycleService,
  ServerFormalizationSourceReader,
} from '@/formalization/provision'
import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

@Injectable()
export class FormalizationApplicationService {
  private readonly startUseCase: StartFormalizationUseCase
  private readonly getUseCase: GetFormalizationUseCase
  private readonly saveDraftUseCase: SaveFormalizationContractFormDraftUseCase
  private readonly closeFormUseCase: CloseFormalizationContractFormUseCase
  private readonly reopenFormUseCase: ReopenFormalizationContractFormUseCase
  private readonly replaceFormUseCase: ReplaceFormalizationContractFormUseCase
  private readonly closeWithoutContractUseCase: CloseFormalizationWithoutContractUseCase
  private readonly getSelectionUseCase: GetFormalizationDocumentSelectionUseCase
  private readonly replaceSelectionUseCase: ReplaceFormalizationDocumentSelectionUseCase
  private readonly listDocumentsUseCase: ListFormalizationDocumentsUseCase
  private readonly generateDocumentUseCase: GenerateFormalizationDocumentUseCase
  private readonly cancelGenerationUseCase: CancelFormalizationDocumentGenerationUseCase
  private readonly getVersionUseCase: GetFormalizationDocumentVersionUseCase
  private readonly saveManualVersionUseCase: SaveManualFormalizationDocumentVersionUseCase
  private readonly reviewVersionUseCase: ReviewFormalizationDocumentVersionUseCase
  private readonly selectCurrentVersionUseCase: SelectCurrentFormalizationDocumentVersionUseCase
  private readonly confirmDocumentsUseCase: ConfirmFormalizationDocumentsUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: FormalizationsRepository,
    @Inject(ServerFormalizationSourceReader)
    sourceReader: FormalizationSourceReader,
    @Inject(ServerFormalizationIntakeLifecycleService)
    intakeLifecycleService: FormalizationIntakeLifecycleService,
    @Inject(ServerFormalizationIntakeClosureService)
    intakeClosureService: FormalizationIntakeClosureService,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter)
    documentFileExporter: DocumentFileExporter,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
  ) {
    this.startUseCase = new StartFormalizationUseCase(
      formalizationsRepository,
      sourceReader,
      intakeLifecycleService,
      idProvider,
    )
    this.getUseCase = new GetFormalizationUseCase(formalizationsRepository, sourceReader)
    this.saveDraftUseCase = new SaveFormalizationContractFormDraftUseCase(
      formalizationsRepository,
    )
    this.closeFormUseCase = new CloseFormalizationContractFormUseCase(
      formalizationsRepository,
      datetimeProvider,
    )
    this.reopenFormUseCase = new ReopenFormalizationContractFormUseCase(
      formalizationsRepository,
    )
    this.replaceFormUseCase = new ReplaceFormalizationContractFormUseCase(
      formalizationsRepository,
      sourceReader,
    )
    this.closeWithoutContractUseCase = new CloseFormalizationWithoutContractUseCase(
      formalizationsRepository,
      intakeClosureService,
      datetimeProvider,
    )
    this.getSelectionUseCase = new GetFormalizationDocumentSelectionUseCase(
      formalizationsRepository,
      sourceReader,
      specificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
    )
    this.replaceSelectionUseCase = new ReplaceFormalizationDocumentSelectionUseCase(
      formalizationsRepository,
      sourceReader,
      specificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
      idProvider,
      datetimeProvider,
    )
    this.listDocumentsUseCase = new ListFormalizationDocumentsUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      generationsRepository,
      versionsRepository,
    )
    this.generateDocumentUseCase = new GenerateFormalizationDocumentUseCase(
      formalizationsRepository,
      sourceReader,
      documentPackagesRepository,
      packageDocumentsRepository,
      specificationsRepository,
      generationsRepository,
      broker,
      datetimeProvider,
      idProvider,
    )
    this.cancelGenerationUseCase = new CancelFormalizationDocumentGenerationUseCase(
      formalizationsRepository,
      generationsRepository,
      datetimeProvider,
      broker,
    )
    this.getVersionUseCase = new GetFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
    )
    this.saveManualVersionUseCase = new SaveManualFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
      documentFileExporter,
      fileStorageProvider,
      datetimeProvider,
      idProvider,
    )
    this.reviewVersionUseCase = new ReviewFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      datetimeProvider,
    )
    this.selectCurrentVersionUseCase =
      new SelectCurrentFormalizationDocumentVersionUseCase(
        formalizationsRepository,
        documentPackagesRepository,
        packageDocumentsRepository,
        documentsRepository,
        versionsRepository,
      )
    this.confirmDocumentsUseCase = new ConfirmFormalizationDocumentsUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      generationsRepository,
      datetimeProvider,
    )
  }

  start(input: Parameters<StartFormalizationUseCase['execute']>[0]) {
    return this.startUseCase.execute(input)
  }

  get(input: Parameters<GetFormalizationUseCase['execute']>[0]) {
    return this.getUseCase.execute(input)
  }

  saveDraft(input: Parameters<SaveFormalizationContractFormDraftUseCase['execute']>[0]) {
    return this.saveDraftUseCase.execute(input)
  }

  closeForm(input: Parameters<CloseFormalizationContractFormUseCase['execute']>[0]) {
    return this.closeFormUseCase.execute(input)
  }

  reopenForm(input: Parameters<ReopenFormalizationContractFormUseCase['execute']>[0]) {
    return this.reopenFormUseCase.execute(input)
  }

  replaceForm(input: Parameters<ReplaceFormalizationContractFormUseCase['execute']>[0]) {
    return this.replaceFormUseCase.execute(input)
  }

  closeWithoutContract(
    input: Parameters<CloseFormalizationWithoutContractUseCase['execute']>[0],
  ) {
    return this.closeWithoutContractUseCase.execute(input)
  }

  async getSelection(
    input: Parameters<GetFormalizationDocumentSelectionUseCase['execute']>[0],
  ) {
    const formalization = await this.assertDocumentOperationAllowed(input.formalizationId)
    const selection = await this.getSelectionUseCase.execute(input)

    return {
      ...selection,
      confirmedAt: formalization?.documentsConfirmedAt,
      confirmedByCollaboratorId: formalization?.documentsConfirmedByCollaboratorId,
    }
  }

  replaceSelection(
    input: Parameters<ReplaceFormalizationDocumentSelectionUseCase['execute']>[0],
  ) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.replaceSelectionUseCase.execute(input),
    )
  }

  listDocuments(input: Parameters<ListFormalizationDocumentsUseCase['execute']>[0]) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.listDocumentsUseCase.execute(input),
    )
  }

  generateDocument(
    input: Parameters<GenerateFormalizationDocumentUseCase['execute']>[0],
  ) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.generateDocumentUseCase.execute(input),
    )
  }

  cancelGeneration(
    input: Parameters<CancelFormalizationDocumentGenerationUseCase['execute']>[0],
  ) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.cancelGenerationUseCase.execute(input),
    )
  }

  getVersion(input: Parameters<GetFormalizationDocumentVersionUseCase['execute']>[0]) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.getVersionUseCase.execute(input),
    )
  }

  saveManualVersion(
    input: Parameters<SaveManualFormalizationDocumentVersionUseCase['execute']>[0],
  ) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.saveManualVersionUseCase.execute(input),
    )
  }

  reviewVersion(
    input: Parameters<ReviewFormalizationDocumentVersionUseCase['execute']>[0],
  ) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.reviewVersionUseCase.execute(input),
    )
  }

  selectCurrentVersion(
    input: Parameters<SelectCurrentFormalizationDocumentVersionUseCase['execute']>[0],
  ) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.selectCurrentVersionUseCase.execute(input),
    )
  }

  confirmDocuments(
    input: Parameters<ConfirmFormalizationDocumentsUseCase['execute']>[0],
  ) {
    return this.assertDocumentOperationAllowed(input.formalizationId).then(() =>
      this.confirmDocumentsUseCase.execute(input),
    )
  }

  private async assertDocumentOperationAllowed(formalizationId: string) {
    const formalization = await this.formalizationsRepository.findById(formalizationId)
    if (formalization?.status === FormalizationStatus.Cancelled) {
      throw new FormalizationStateConflictError(
        'A formalização cancelada não pode operar documentos.',
      )
    }
    return formalization
  }
}
