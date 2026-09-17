import type { INestApplication, Type } from '@nestjs/common'
import type { Collaborator, User } from '@hms/core/identity/domain/entities'
import {
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'

import { IdentityModule } from '@/identity/identity.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import {
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { LegalCatalogProvisionModule } from '@/legal-catalog/provision/legal-catalog-provision.module'
import {
  DrizzleLegalAreasRepository,
  DrizzleLegalTopicsRepository,
  DrizzleDynamicFormAdministrationRepository,
} from '@/legal-catalog/database/drizzle/repositories'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdProvider } from '@/shared/provision/id/id-provider'

export class LegalCatalogControllerTestFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly areasRepository: DrizzleLegalAreasRepository,
    private readonly topicsRepository: DrizzleLegalTopicsRepository,
    readonly dynamicFormsRepository: DynamicFormAdministrationRepository,
    private readonly idProvider: IdProvider,
    private readonly authentication: {
      userId?: string
      collaborator?: CollaboratorSummary
    },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller: Type<unknown>) {
    const authentication: { userId?: string; collaborator?: CollaboratorSummary } = {}
    const restFixture = await RestFixture.register(
      {
        imports: [
          IdentityModule,
          LegalCatalogModule,
          LegalCatalogProvisionModule,
          ProvisionModule,
        ],
        controllers: [controller],
      },
      (builder) =>
        builder.overrideProvider(IDENTITY_PROVIDERS.auth).useValue({
          getSession: async (accessToken: string) => {
            if (accessToken !== 'fixture-access-token' || !authentication.userId) {
              return null
            }
            return {
              accessToken,
              sessionId: 'fixture-session',
              user: {
                id: authentication.userId,
                email: authentication.collaborator?.email ?? 'fixture@hms.test',
              },
            }
          },
        }),
    )

    return new LegalCatalogControllerTestFixture(
      restFixture,
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
      restFixture.get(DrizzleLegalAreasRepository),
      restFixture.get(DrizzleLegalTopicsRepository),
      restFixture.get(DrizzleDynamicFormAdministrationRepository),
      restFixture.get(IdProvider),
      authentication,
    )
  }

  async registerAdmin() {
    const userDraft = UserFaker.fake({ status: 'active', email: 'admin@fixture.test' })
    const [user] = await this.usersRepository.addMany([
      {
        id: userDraft.id,
        email: userDraft.email,
        status: userDraft.status,
        lastAccessAt: userDraft.lastAccessAt,
      },
    ])
    if (!user) throw new Error('Fixture user was not created')

    const collaborator = await this.collaboratorsRepository.add(
      CollaboratorCreationFaker.administrative({ userId: user.id, profile: 'admin' }),
    )
    if (!collaborator) throw new Error('Fixture collaborator was not created')
    this.authentication.userId = user.id
    this.authentication.collaborator = this.toSummary(user, collaborator)
    return { user, collaborator }
  }

  async registerAttendant() {
    const userDraft = UserFaker.fake({
      status: 'active',
      email: 'attendant@fixture.test',
    })
    const [user] = await this.usersRepository.addMany([
      {
        id: userDraft.id,
        email: userDraft.email,
        status: userDraft.status,
        lastAccessAt: userDraft.lastAccessAt,
      },
    ])
    if (!user) throw new Error('Fixture user was not created')

    const collaborator = await this.collaboratorsRepository.add(
      CollaboratorCreationFaker.administrative({
        userId: user.id,
        profile: 'attendant',
      }),
    )
    if (!collaborator) throw new Error('Fixture collaborator was not created')
    this.authentication.userId = user.id
    this.authentication.collaborator = this.toSummary(user, collaborator)
    return { user, collaborator }
  }

  authenticateAsAdmin() {
    if (!this.authentication.collaborator)
      throw new Error('Register an admin before authenticating')
    return 'Bearer fixture-access-token'
  }

  async seedDynamicForm(overrides: Partial<DynamicForm> = {}): Promise<DynamicForm> {
    const [area] = await this.areasRepository.addMany([{ name: 'Cível', active: true }])
    if (!area) throw new Error('Fixture area was not created')
    const [topic] = await this.topicsRepository.addMany([
      { legalAreaId: area.id, name: 'Contratos', active: true },
    ])
    if (!topic) throw new Error('Fixture topic was not created')

    const now = new Date('2026-09-11T12:00:00.000Z')
    const form: DynamicForm = {
      id: this.idProvider.generate(),
      name: 'Triagem Cível',
      normalizedName: 'triagem cível',
      description: 'Fixture form',
      status: 'available',
      stage: 'consultation',
      legalAreaId: area.id,
      legalTopicIds: [topic.id],
      fields: [
        {
          id: this.idProvider.generate(),
          key: 'facts',
          label: 'Fatos',
          type: 'long_text',
          position: 1,
          required: true,
        },
      ],
      version: 1,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }
    await this.dynamicFormsRepository.add(form)
    return form
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }

  private toSummary(user: User, collaborator: Collaborator): CollaboratorSummary {
    return {
      collaboratorId: collaborator.id,
      professionalName: collaborator.professionalName,
      email: user.email,
      profile: collaborator.profile,
      status: user.status,
    }
  }
}
