import { HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { DocumentValidationAnalysisRequestedEvent } from '@hms/core/document-engine/domain/events'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { CurrentUser } from '@/identity/decorators'
import { InngestService } from '@/shared/provision/inngest/inngest.service'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class AnalyzeDocumentValidationController {
  constructor(private readonly inngestService: InngestService) {}

  @Post('documents/:documentFileId/analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('documentFileId') documentFileId: string,
    @CurrentUser() authUser: AuthUser,
  ) {
    const event = new DocumentValidationAnalysisRequestedEvent({
      documentFileId,
      requestedBy: authUser.id,
      occurredAt: new Date(),
    })

    await this.inngestService.client.send({
      name: event.name,
      data: {
        ...event.payload,
        occurredAt: event.payload.occurredAt.toISOString(),
      },
    })

    return {
      documentFileId,
      status: 'analysis_queued',
      inngestEventName: event.name,
      message: 'Análise documental enviada para processamento em segundo plano.',
    }
  }
}
