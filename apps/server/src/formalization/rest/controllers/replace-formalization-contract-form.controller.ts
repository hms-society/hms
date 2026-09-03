import { Body, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { replaceFormalizationContractFormSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class ReplaceBody extends createZodDto(replaceFormalizationContractFormSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReplaceFormalizationContractFormController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Put(':formalizationId/contract-form/definition')
  @ApiResponse({ status: 200, type: FormalizationResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(replaceFormalizationContractFormSchema))
    body: ReplaceBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .replaceForm({
        formalizationId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
        ...body,
      })
      .then((formalization) => ({ ...formalization }))
  }
}
