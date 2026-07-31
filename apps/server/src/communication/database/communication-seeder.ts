import { Injectable, Inject } from '@nestjs/common'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { communicationModel } from '@/communication/database/drizzle/models/communication-model'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'

@Injectable()
export class CommunicationSeeder {
  constructor(
    @Inject(DrizzleClient) private readonly drizzleClient: DrizzleClient,
  ) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()
    await db.delete(communicationModel)
  }

  async run() {
    const db = this.drizzleClient.requireDatabase()
    const clients = await db.select().from(clientModel).limit(5)
    const users = await db.select().from(userModel).limit(1)

    if (clients.length === 0 || users.length === 0) return

    const authorId = users[0].id

    const mockCommunications = clients.flatMap(client => [
      {
        clientId: client.id,
        authorId: null,
        channel: 'whatsapp' as const,
        direction: 'inbound' as const,
        content: 'Olá, gostaria de saber sobre o andamento da minha solicitação.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
      {
        clientId: client.id,
        authorId,
        channel: 'whatsapp' as const,
        direction: 'outbound' as const,
        content: 'Olá! Seu processo está na fase de coleta de documentos. Pode nos enviar seu RG?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 47),
      },
      {
        clientId: client.id,
        authorId: null,
        channel: 'email' as const,
        direction: 'inbound' as const,
        content: 'Segue em anexo o documento solicitado.\n\nAtt,\nCliente',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        clientId: client.id,
        authorId,
        channel: 'phone' as const,
        direction: 'outbound' as const,
        content: 'Ligação de alinhamento com o cliente para confirmar o recebimento dos documentos.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      }
    ])

    await db.insert(communicationModel).values(mockCommunications)
  }
}