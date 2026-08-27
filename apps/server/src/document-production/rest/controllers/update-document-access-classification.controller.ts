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
import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import type {
  DocumentsRepository,
  PackageDocumentsRepository,
  DocumentPackagesRepository,
} from '@hms/core/document-production/interfaces'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
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
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
  ) {
    this.updateClassificationUseCase = new UpdateDocumentAccessClassificationUseCase(
      documentsRepository,
      packageDocumentsRepository,
      documentPackagesRepository,
      consultationsRepository,
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
        collaboratorId: req.identity!.collaborator!.collaboratorId,
        collaboratorProfile: req.identity!.collaborator!.profile,
        newClassification: body.classification,
      })

      return result
    } catch (error: any) {
      throw new BadRequestException(error.message)
    }
  }
}
