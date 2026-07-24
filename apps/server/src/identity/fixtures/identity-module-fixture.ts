import type { INestApplication, Type } from '@nestjs/common'
import type {
  ClientConsentCreation,
  ClientCreation,
} from '@hms/core/identity/domain/entities'
import { ClientFaker } from '@hms/core/identity/domain/entities/fakers'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import {
  DrizzleClientConsentsRepository,
  DrizzleClientsRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

type NaturalClientCreation = Extract<ClientCreation, { type: 'natural' }>

export class IdentityModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly clientsRepository: DrizzleClientsRepository,
    private readonly clientConsentsRepository: DrizzleClientConsentsRepository,
    private readonly identitySeeder: IdentitySeeder,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller: Type<unknown>) {
    const restFixture = await RestFixture.register({
      imports: [IdentityDatabaseModule],
      controllers: [controller],
      providers: [DatetimeProvider],
    })

    return new IdentityModuleFixture(
      restFixture,
      restFixture.get(DrizzleClientsRepository),
      restFixture.get(DrizzleClientConsentsRepository),
      restFixture.get(IdentitySeeder),
    )
  }

  registerClient(overrides: Partial<NaturalClientCreation> = {}) {
    const draft = ClientFaker.fake(overrides)

    return this.clientsRepository.add({
      type: 'natural',
      name: draft.type === 'natural' ? draft.name : 'Cliente de teste',
      taxId: draft.type === 'natural' ? draft.taxId : ClientFaker.fake().taxId,
      phone: draft.phone,
      email: draft.email,
      address: draft.address,
    })
  }

  seedClients(overrides: Partial<NaturalClientCreation>[]) {
    return this.identitySeeder.seed(
      overrides.map((override) => {
        const draft = ClientFaker.fake(override)
        return {
          type: 'natural' as const,
          name: draft.type === 'natural' ? draft.name : 'Cliente de teste',
          taxId: draft.type === 'natural' ? draft.taxId : ClientFaker.fake().taxId,
          phone: draft.phone,
          email: draft.email,
          address: draft.address,
        }
      }),
    )
  }

  registerConsents(consents: ClientConsentCreation[]) {
    return this.clientConsentsRepository.addMany(consents)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }
}
