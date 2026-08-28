import { Body, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { closeFormalizationWithoutContractSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class CloseWithoutContractBody extends createZodDto(
  closeFormalizationWithoutContractSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CloseFormalizationWithoutContractController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/close-without-contract')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(closeFormalizationWithoutContractSchema))
    body: CloseWithoutContractBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service
      .get({
        formalizationId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then(({ formalization }) =>
        this.service.closeWithoutContract({
          formalizationId,
          intakeId: formalization.intakeId,
          actorId: collaborator.collaboratorId,
          reason: body.reason,
          notes: body.notes,
          expectedVersion: body.expectedIntakeVersion,
          expectedFormalizationVersion: body.expectedVersion,
          actorProfile: collaborator.profile,
        }),
      )
  }
}
