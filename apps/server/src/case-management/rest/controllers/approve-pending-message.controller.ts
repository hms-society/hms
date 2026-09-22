import { Inject, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApproveAssistedMessageUseCase } from '@hms/core/case-management/use-cases'
import type { PendingsRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ApprovePendingMessageController {
  private readonly useCase: ApproveAssistedMessageUseCase
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.pendings) repository: PendingsRepository,
  ) {
    this.useCase = new ApproveAssistedMessageUseCase(repository)
  }
  @Post('pendencies/:pendingId/message/approve')
  handle(
    @Param('pendingId', new ParseUUIDPipe()) pendingId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({ pendingId, approvedBy: collaborator.collaboratorId })
  }
}
