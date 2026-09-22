import { Body, Inject, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { createZodDto } from 'nestjs-zod'
import { cancelPendingSchema } from '@hms/validation/case-management'
import { CancelPendingUseCase } from '@hms/core/case-management/use-cases'
import type { PendingsRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
class CancelBody extends createZodDto(cancelPendingSchema) {}
@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CancelPendingController {
  private readonly useCase: CancelPendingUseCase
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.pendings) repository: PendingsRepository,
  ) {
    this.useCase = new CancelPendingUseCase(repository)
  }
  @Post('pendencies/:pendingId/cancel')
  handle(
    @Param('pendingId', new ParseUUIDPipe()) pendingId: string,
    @Body() body: CancelBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...body,
      pendingId,
      cancelledBy: collaborator.collaboratorId,
    })
  }
}
