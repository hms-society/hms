import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { updateFormalizationContractFormSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class CloseBody extends createZodDto(updateFormalizationContractFormSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CloseFormalizationContractFormController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/contract-form/close')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(updateFormalizationContractFormSchema)) body: CloseBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.closeForm({
      formalizationId,
      actorId: collaborator.collaboratorId,
      ...body,
      actorProfile: collaborator.profile,
    })
  }
}
