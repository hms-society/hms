import { Controller, Get, Param, Inject, HttpStatus } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { GetDocumentFileUseCase } from '@hms/core/documents/use-cases'
import type { DocumentBatchesRepository } from '@hms/core/documents/interfaces'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DOCUMENTS_REPOSITORIES } from '@/documents/database/drizzle/constants/documents-repositories'

@Controller('documents')
export class GetDocumentFileController {
  private readonly useCase: GetDocumentFileUseCase

  constructor(
    @Inject(DOCUMENTS_REPOSITORIES.documentBatches)
    documentBatchesRepository: DocumentBatchesRepository,
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
}