import { Controller, Get, Param } from '@nestjs/common'
import { listClientDocumentBatch } from '@hms/core/documents/use-cases'

@Controller('document-batches')
export class ListClientDocumentController {
  constructor(
    private readonly listClientDocumentBatchesUseCase: listClientDocumentBatch,
  ) {}

  @Get('clients/:clientId')
  async handle(@Param('clientId') clientId: string) {
    const batches = await this.listClientDocumentBatchesUseCase.execute(clientId)
    return batches
  }
}