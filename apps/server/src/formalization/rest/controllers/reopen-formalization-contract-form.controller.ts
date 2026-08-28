import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { reopenFormalizationContractFormSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class ReopenBody extends createZodDto(reopenFormalizationContractFormSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReopenFormalizationContractFormController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/contract-form/reopen')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(reopenFormalizationContractFormSchema)) body: ReopenBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.reopenForm({
      formalizationId,
      actorId: collaborator.collaboratorId,
      ...body,
      actorProfile: collaborator.profile,
    })
  }
}
