import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { replaceFormalizationSignatoryDocumentsSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ReplaceFormalizationSignatoryDocumentsUseCase } from '@hms/core/formalization/use-cases'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<ReplaceFormalizationSignatoryDocumentsUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile' | 'signatoryId'
>

class ReplaceFormalizationSignatoryDocumentsBody extends createZodDto(
  replaceFormalizationSignatoryDocumentsSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReplaceFormalizationSignatoryDocumentsController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Put(':formalizationId/signature-configuration/signatories/:signatoryId/documents')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The signatory documents were replaced.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('signatoryId', new ParseUUIDPipe()) signatoryId: string,
    @Body(new ZodValidationPipe(replaceFormalizationSignatoryDocumentsSchema))
    body: ReplaceFormalizationSignatoryDocumentsBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.replaceSignatureSignatoryDocuments({
      formalizationId,
      signatoryId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
