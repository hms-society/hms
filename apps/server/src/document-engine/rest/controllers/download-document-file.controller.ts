import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { DownloadDocumentFileUseCase } from '@hms/core/document-engine/use-cases'
import type { CaseAccessProvider } from '@hms/core/case-management/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { StorageProvider } from '@hms/core/shared/interfaces'

import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@Controller('documents')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class DownloadDocumentFileController {
  private readonly useCase: DownloadDocumentFileUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentBatches)
    documentBatchesRepository: DocumentBatchesRepository,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
    @Inject(CASE_MANAGEMENT_ACCESS.access) caseAccessProvider: CaseAccessProvider,
  ) {
    this.useCase = new DownloadDocumentFileUseCase(
      documentBatchesRepository,
      documentValidationsRepository,
      storage,
      caseAccessProvider,
    )
  }

  @Get('files/:fileId/content')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'O conteúdo do arquivo foi retornado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Arquivo não encontrado.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('fileId') fileId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Res() response: Response,
  ) {
    const file = await this.useCase.execute({
      fileId,
      actorId: collaborator.collaboratorId,
    })

    return response
      .status(HttpStatus.OK)
      .type(file.mimeType)
      .setHeader('Content-Length', String(file.content.byteLength))
      .setHeader('Content-Disposition', `inline; filename="${file.fileName}"`)
      .send(Buffer.from(file.content))
  }
}
