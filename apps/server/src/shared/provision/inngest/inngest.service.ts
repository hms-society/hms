import { Injectable, Logger } from '@nestjs/common'
import { Inngest } from 'inngest'
import { WhatsappProvider } from '../../communication/whatsapp.provider'

@Injectable()
export class InngestService {
  private readonly logger = new Logger(InngestService.name)
  public readonly client: Inngest

  constructor(readonly _whatsappProvider: WhatsappProvider) {
    this.client = new Inngest({ id: 'hms-server' })
  }

  getFunctions() {
    return [
      this.client.createFunction(
        {
          id: 'whatsapp-event-received',
          name: 'WhatsApp Event Received',
          triggers: [{ event: 'whatsapp/event.received' }],
        },
        async ({ event, step }) => {
          this.logger.log('Inngest processando evento whatsapp/event.received')
          const payload = event.data

          // TODO: Identificar a natureza do evento recebido e executar o job correspondente:
          // 1. Agendamento (Respostas de botões interativos ou mensagens contendo palavras-chave de agendamento)
          // 2. Documentos (Eventos contendo arquivos de mídia: imagens, vídeos, PDFs, etc.)
          // 3. Texto Livre (Mensagens normais de texto ou legendas que alimentam o atendimento humano)
          
          await step.run('process-whatsapp-event', async () => {
            this.logger.log(`Executando passo no Inngest com payload: ${JSON.stringify(payload)}`)
          })
        }
      )
    ]
  }
}
