import { Injectable, type OnModuleInit, Inject } from '@nestjs/common'
import { InngestService } from '@/shared/provision/inngest/inngest.service'

@Injectable()
export class ProcessWhatsappBatchWorker implements OnModuleInit {
  constructor(
    @Inject(InngestService)
    private readonly inngestService: InngestService,
  ) {}

  onModuleInit() {
    if (!this.inngestService?.client) {
      return
    }

    this.inngestService.register(
      this.inngestService.client.createFunction(
        {
          id: 'process-whatsapp-batch',
          name: 'Process WhatsApp Document Batch',
          triggers: [{ event: 'documents/whatsapp.batch.received' }],
        },
        async ({ event, step }) => {
          await step.run('process-batch-metadata', async () => {
            console.log('Processando lote do WhatsApp:', event.data)
          })
        },
      ),
    )
  }
}
