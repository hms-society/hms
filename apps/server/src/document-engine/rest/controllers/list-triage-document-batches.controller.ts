import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common'
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
  async handle(@Query('page') pageRaw?: string, @Query('limit') limitRaw?: string) {
    const page = pageRaw ? Number.parseInt(pageRaw, 10) : undefined
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined

    return await this.listTriageDocumentBatchesUseCase.execute({
      page: Number.isNaN(page) ? undefined : page,
      limit: Number.isNaN(limit) ? undefined : limit,
    })
  }
}
