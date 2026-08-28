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
import { selectFormalizationSignatoryChannelSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { SelectFormalizationSignatoryChannelUseCase } from '@hms/core/formalization/use-cases'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<SelectFormalizationSignatoryChannelUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile' | 'signatoryId'
>

class SelectFormalizationSignatoryChannelBody extends createZodDto(
  selectFormalizationSignatoryChannelSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SelectFormalizationSignatoryChannelController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Put(':formalizationId/signature-configuration/signatories/:signatoryId/channel')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The signatory channel selection was updated.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('signatoryId', new ParseUUIDPipe()) signatoryId: string,
    @Body(new ZodValidationPipe(selectFormalizationSignatoryChannelSchema))
    body: SelectFormalizationSignatoryChannelBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.selectSignatureSignatoryChannel({
      formalizationId,
      signatoryId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
