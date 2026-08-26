import { Controller, Get, Inject } from '@nestjs/common'
import { ListTriageDocumentBatchesUseCase } from '@hms/core/document-engine/use-cases'

@Controller('document-batches')
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
