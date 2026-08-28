import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ListTriageDocumentBatchesUseCase } from '@hms/core/document-engine/use-cases'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@Controller('document-batches')
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListTriageDocumentBatchesController {
  constructor(
    @Inject(ListTriageDocumentBatchesUseCase)
    private readonly listTriageDocumentBatchesUseCase: ListTriageDocumentBatchesUseCase,
  ) {}

  @Get('triage')
  async handle() {
    const batches = await this.listTriageDocumentBatchesUseCase.execute()
    return batches
  }
}
