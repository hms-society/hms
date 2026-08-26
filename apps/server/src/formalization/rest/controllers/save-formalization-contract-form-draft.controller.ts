import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { updateFormalizationContractFormSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class DraftBody extends createZodDto(updateFormalizationContractFormSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SaveFormalizationContractFormDraftController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/contract-form/draft')
  @ApiResponse({ status: 200, type: FormalizationResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(updateFormalizationContractFormSchema)) body: DraftBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .saveDraft({
        formalizationId,
        actorId: collaborator.collaboratorId,
        ...body,
        actorProfile: collaborator.profile,
      })
      .then((formalization) => ({ ...formalization }))
  }
}
