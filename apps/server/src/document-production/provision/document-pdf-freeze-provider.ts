import { Inject, Injectable } from '@nestjs/common'
import type { DocumentPdfFreezeService } from '@hms/core/document-production/interfaces'
import { FreezeApprovedDocumentVersionPdfUseCase } from '@hms/core/document-production/use-cases'
import type {
  DatetimeProvider,
  FileStorageProvider,
  IdProvider,
} from '@hms/core/shared/interfaces'
import type {
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  FrozenDocumentPdfsRepository,
} from '@hms/core/document-production/interfaces'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'

@Injectable()
export class DocumentPdfFreezeProvider implements DocumentPdfFreezeService {
  private readonly useCase: FreezeApprovedDocumentVersionPdfUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.frozenPdfs)
    frozenPdfsRepository: FrozenDocumentPdfsRepository,
    @Inject(PROVISION_PROVIDERS.fileStorage) fileStorageProvider: FileStorageProvider,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter)
    converter: import('@hms/core/document-production/interfaces').DocumentPdfConverter,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentPdfInspector)
    inspector: import('@hms/core/document-production/interfaces').DocumentPdfInspector,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(ServerIdProvider) idProvider: IdProvider,
  ) {
    this.useCase = new FreezeApprovedDocumentVersionPdfUseCase({
      documentsRepository,
      versionsRepository,
      specificationsRepository,
      frozenPdfsRepository,
      fileStorageProvider,
      converter,
      inspector,
      datetimeProvider,
      idProvider,
    })
  }

  freeze(input: Parameters<DocumentPdfFreezeService['freeze']>[0]) {
    return this.useCase.execute(input)
  }
}
