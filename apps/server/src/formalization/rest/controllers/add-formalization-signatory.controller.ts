import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { addFormalizationSignatorySchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { AddFormalizationSignatoryUseCase } from '@hms/core/formalization/use-cases'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<AddFormalizationSignatoryUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile'
>

class AddFormalizationSignatoryBody extends createZodDto(
  addFormalizationSignatorySchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class AddFormalizationSignatoryController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Post(':formalizationId/signature-configuration/signatories')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, description: 'The signatory was added.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(addFormalizationSignatorySchema))
    body: AddFormalizationSignatoryBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.addSignatureSignatory({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
