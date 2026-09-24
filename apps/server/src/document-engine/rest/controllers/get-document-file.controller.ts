import { Controller, Get, Param, Inject, HttpStatus, Res } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'
import { GetDocumentFileUseCase } from '@hms/core/document-engine/use-cases'
import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'

@Controller('documents')
export class GetDocumentFileController {
  private readonly useCase: GetDocumentFileUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentBatches)
    documentBatchesRepository: DocumentBatchesRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {
    this.useCase = new GetDocumentFileUseCase(documentBatchesRepository)
  }

  @Get('files/:fileId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'O arquivo foi retornado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Arquivo não encontrado.',
    type: ErrorResponseDto,
  })
  handle(@Param('fileId') fileId: string) {
    return this.useCase.execute({ fileId })
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
  async content(@Param('fileId') fileId: string, @Res() response: Response) {
    const file = await this.useCase.execute({ fileId })
    const content = await this.storageProvider.download(file.storagePath)

    return response
      .status(HttpStatus.OK)
      .type(file.mimeType)
      .setHeader('Content-Length', String(content.byteLength))
      .setHeader('Content-Disposition', `inline; filename="${file.originalName}"`)
      .send(Buffer.from(content))
  }
}
