import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import type { PendingsRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetPendingMessageController {
  constructor(@Inject(CASE_MANAGEMENT_REPOSITORIES.pendings) private readonly repository: PendingsRepository) {}

  @Get('pendencies/:pendingId/message')
  async handle(@Param('pendingId', new ParseUUIDPipe()) pendingId: string) {
    const message = await this.repository.findMessageByPendingId(pendingId)
    if (!message) return { statusCode: HttpStatus.NOT_FOUND, message: 'Mensagem assistida não encontrada.' }
    return message
  }
}
