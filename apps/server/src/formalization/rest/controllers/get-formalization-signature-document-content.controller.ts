import {
  Get,
  Header,
  HttpStatus,
  Inject,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiProduces, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { FormalizationSignatureDocumentContentKind } from '@hms/core/formalization/domain/structures'
import type { FormalizationSignatureDocumentContentKind as DocumentContentKind } from '@hms/core/formalization/domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
} from '@hms/core/formalization/interfaces'
import { GetFormalizationSignatureDocumentContentUseCase } from '@hms/core/formalization/use-cases'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationSignatureDocumentContentController {
  private readonly useCase: GetFormalizationSignatureDocumentContentUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureArtifacts)
    artifactsRepository: FormalizationSignatureArtifactsRepository,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
  ) {
    this.useCase = new GetFormalizationSignatureDocumentContentUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository,
      artifactsRepository,
      fileStorageProvider,
    })
  }

  @Get(':formalizationId/signature-sending/documents/:requestDocumentId/:contentKind')
  @ApiProduces('application/pdf')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The preserved signature document was returned.',
    content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  async handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('requestDocumentId', new ParseUUIDPipe()) requestDocumentId: string,
    @Param('contentKind', new ParseEnumPipe(FormalizationSignatureDocumentContentKind))
    contentKind: DocumentContentKind,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    const storedFile = await this.useCase.execute({
      formalizationId,
      requestDocumentId,
      contentKind,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })

    return new StreamableFile(Buffer.from(storedFile.content), {
      type: 'application/pdf',
      disposition: `inline; filename="${this.getSafeFileName(storedFile.file.fileName)}"`,
      length: storedFile.content.byteLength,
    })
  }

  private getSafeFileName(fileName: string) {
    const safeFileName = fileName.replace(/[\r\n"]/g, '_').trim()
    return safeFileName.toLowerCase().endsWith('.pdf')
      ? safeFileName
      : `${safeFileName || 'documento'}.pdf`
  }
}
