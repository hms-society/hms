import { Body, Inject, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { createZodDto } from 'nestjs-zod'
import { editAssistedMessageSchema } from '@hms/validation/case-management'
import { EditAssistedMessageUseCase } from '@hms/core/case-management/use-cases'
import type { PendingsRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

class EditMessageBody extends createZodDto(editAssistedMessageSchema) {}

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class EditPendingMessageController {
  private readonly useCase: EditAssistedMessageUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.pendings) repository: PendingsRepository,
  ) {
    this.useCase = new EditAssistedMessageUseCase(repository)
  }

  @Patch('pendencies/:pendingId/message')
  handle(
    @Param('pendingId', new ParseUUIDPipe()) pendingId: string,
    @Body() body: EditMessageBody,
  ) {
    return this.useCase.execute({ ...body, pendingId })
  }
}
