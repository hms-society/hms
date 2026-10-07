import type { INestApplication } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { PrivateMessagesRepository } from '@hms/core/communication/interfaces'
import type {
  ClientsRepository,
  UsersRepository,
  CollaboratorsRepository,
} from '@hms/core/identity/interfaces'
import { ClientFaker } from '@hms/core/identity/domain/entities/fakers'

import { DrizzlePrivateMessagesRepository } from '@/communication/database/drizzle/repositories/drizzle-private-messages-repository'
import { CommunicationModule } from '@/communication/communication.module'
import { DrizzleWhatsappChannelRepository } from '@/communication/database/drizzle/repositories/drizzle-whatsapp-channel-repository'
import { MetaGraphFixture } from '@/communication/fixtures/meta-graph-fixture'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

export class CommunicationRestModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly authFixture: SupabaseAuthFixture,
    readonly metaFixture: MetaGraphFixture,
    readonly clientsRepository: ClientsRepository,
    readonly messagesRepository: PrivateMessagesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    readonly channelsRepository: DrizzleWhatsappChannelRepository,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register() {
    const metaFixture = await MetaGraphFixture.register()
    let authFixture: SupabaseAuthFixture
    try {
      authFixture = await SupabaseAuthFixture.register()
    } catch (error) {
      await metaFixture.close()
      throw error
    }
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        { imports: [CommunicationModule] },
        (builder) => authFixture.configure(builder),
      )
    } catch (error) {
      await authFixture.close()
      await metaFixture.close()
      throw error
    }
    return new CommunicationRestModuleFixture(
      restFixture,
      authFixture,
      metaFixture,
      restFixture.get(IDENTITY_REPOSITORIES.clients),
      restFixture.get(DrizzlePrivateMessagesRepository),
      restFixture.get(IDENTITY_REPOSITORIES.users),
      restFixture.get(IDENTITY_REPOSITORIES.collaborators),
      restFixture.get(DrizzleWhatsappChannelRepository),
    )
  }

  async createSession() {
    const auth = await this.authFixture.createSignedInUser()
    await this.usersRepository.addMany([
      { id: auth.user.id, email: auth.user.email ?? '', status: 'active' },
    ])
    return `Bearer ${auth.accessToken}`
  }

  async createAdminSession() {
    const auth = await this.authFixture.createSignedInUser()
    await this.usersRepository.addMany([
      { id: auth.user.id, email: auth.user.email ?? '', status: 'active' },
    ])
    await this.collaboratorsRepository.add({
      userId: auth.user.id,
      professionalName: 'Administrador',
      jobTitle: 'Administrador',
      profile: 'admin',
    })
    return { userId: auth.user.id, token: `Bearer ${auth.accessToken}` }
  }

  async createClient() {
    const draft = ClientFaker.fake()
    const client = await this.clientsRepository.add({
      type: 'natural',
      name: draft.name,
      taxId: draft.taxId,
      phone: draft.phone,
      email: `${randomUUID()}@example.com`,
    })
    if (!client) throw new Error('Test client was not created')
    return client
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      try {
        await this.authFixture.close()
      } finally {
        await this.metaFixture.close()
      }
    }
  }
}
