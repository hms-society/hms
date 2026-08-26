import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Inject,
  UsePipes,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { UpdateDocumentAccessClassificationUseCase } from '@hms/core/document-production/use-cases'
import { ZodValidationPipe } from 'nestjs-zod'

import { AuthGuard } from '@/identity/guards/auth.guard'
import { ActiveCollaboratorGuard } from '@/identity/guards/active-collaborator.guard'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import type { DocumentsRepository } from '@hms/core/document-production/interfaces'
import type { IdentityRequest } from '@/identity/context'
import { UpdateDocumentAccessClassificationRequestDto } from '@/document-production/rest/dtos'

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
@Controller('documents')
export class UpdateDocumentAccessClassificationController {
  private readonly updateClassificationUseCase: UpdateDocumentAccessClassificationUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    documentsRepository: DocumentsRepository,
  ) {
    this.updateClassificationUseCase = new UpdateDocumentAccessClassificationUseCase(
      documentsRepository,
    )
  }

  @Patch(':id/access-classification')
  @UsePipes(ZodValidationPipe)
  @ApiOperation({ summary: 'Update document access classification' })
  @ApiBody({ type: UpdateDocumentAccessClassificationRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Document access classification updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async handle(
    @Param('id') documentId: string,
    @Request() req: IdentityRequest,
    @Body() body: UpdateDocumentAccessClassificationRequestDto,
  ) {
    try {
      const result = await this.updateClassificationUseCase.execute({
        documentId,
        userId: req.identity!.user.id,
        newClassification: body.classification,
        destinatarioIdentificador: body.destinatarioIdentificador,
      })

      return result
    } catch (error: any) {
      throw new BadRequestException(error.message)
    }
  }
}
