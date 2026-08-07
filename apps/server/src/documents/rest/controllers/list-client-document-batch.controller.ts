import { Controller, Get, Param } from '@nestjs/common'
import { ListClientDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
@Controller('document-batches')
export class ListClientDocumentController {
  constructor(
    private readonly listClientDocumentBatchesUseCase: ListClientDocumentBatchUseCase,
  ) {}

  @Get('clients/:clientId')
  async handle(@Param('clientId') clientId: string) {
    const batches = await this.listClientDocumentBatchesUseCase.execute(clientId)
    return batches
  }
}