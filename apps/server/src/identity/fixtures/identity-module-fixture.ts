import type { INestApplication, Type } from '@nestjs/common'
import type {
  ClientConsentCreation,
  ClientCreation,
  Collaborator,
  CollaboratorCreation,
  User,
  UserCreation,
} from '@hms/core/identity/domain/entities'
import type { AuthAdministrationProvider } from '@hms/core/identity/interfaces'
import {
  ClientFaker,
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { CaseManagementDatabaseModule } from '@/case-management/database/case-management-database.module'
import { AuthModule } from '@/identity/auth.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IdentityAccessModule } from '@/identity/identity-access.module'
import {
  DrizzleIntakeClientsRepository,
  DrizzleIntakeResponsiblesRepository,
} from '@/identity/database/drizzle/repositories'
import {
  DrizzleClientConsentsRepository,
  DrizzleCollaboratorsRepository,
  DrizzleClientsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { ActiveAdminGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { CaseIdentityTransactionModule } from '@/shared/database/case-identity-transaction.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

type NaturalClientCreation = Extract<ClientCreation, { type: 'natural' }>
type AdministrativeCollaboratorCreation = Extract<
  CollaboratorCreation,
  { profile: 'admin' | 'attendant' | 'client' }
>

export class IdentityModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly authFixture: SupabaseAuthFixture,
    private readonly clientsRepository: DrizzleClientsRepository,
    private readonly clientConsentsRepository: DrizzleClientConsentsRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly identitySeeder: IdentitySeeder,
    private readonly legalCatalogSeeder: LegalCatalogSeeder,
    private readonly accessTokens: Map<string, string>,
    private readonly passwords: Map<string, string>,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  get intakeClientsRepository(): DrizzleIntakeClientsRepository {
    return this.restFixture.get(DrizzleIntakeClientsRepository)
  }

  get intakeResponsiblesRepository(): DrizzleIntakeResponsiblesRepository {
    return this.restFixture.get(DrizzleIntakeResponsiblesRepository)
  }

  static async register(
    controller?: Type<unknown> | Type<unknown>[],
    applicationAccess = false,
  ) {
    const authFixture = await SupabaseAuthFixture.register()
    const accessTokens = new Map<string, string>()
    const passwords = new Map<string, string>()
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        {
          imports: [
            ...(applicationAccess ? [IdentityAccessModule] : []),
            ...(applicationAccess ? [CaseManagementDatabaseModule] : []),
            ...(applicationAccess ? [CaseIdentityTransactionModule] : []),
            AuthModule,
            IdentityDatabaseModule,
            LegalCatalogModule,
            ProvisionModule,
          ],
          controllers: controller
            ? Array.isArray(controller)
              ? controller
              : [controller]
            : [],
          providers: [DatetimeProvider, ActiveAdminGuard, ActiveCollaboratorGuard],
        },
        (builder) => authFixture.configure(builder),
      )
    } catch (error) {
      await authFixture.close()
      throw error
    }

    return new IdentityModuleFixture(
      restFixture,
      authFixture,
      restFixture.get(DrizzleClientsRepository),
      restFixture.get(DrizzleClientConsentsRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(IdentitySeeder),
      restFixture.get(LegalCatalogSeeder),
      accessTokens,
      passwords,
    )
  }

  async registerUser(overrides: Partial<UserCreation> = {}) {
    const auth = await this.authFixture.createSignedInUser(overrides.email)
    const draft = UserFaker.fake({
      status: 'active',
      ...overrides,
      id: auth.user.id,
      email: auth.user.email,
    })
    const [user] = await this.usersRepository.addMany([
      {
        id: draft.id,
        email: draft.email,
        status: draft.status,
        lastAccessAt: draft.lastAccessAt,
      },
    ])

    if (!user) throw new Error('Test user was not created')
    this.accessTokens.set(user.id, auth.accessToken)
    this.passwords.set(user.id, auth.password)
    return user
  }

  async inviteCollaborator(email: string) {
    const authAdministration = this.restFixture.get<AuthAdministrationProvider>(
      IDENTITY_PROVIDERS.authAdministration,
    )
    const authUser = await authAdministration.inviteUserByEmail(
      email,
      'http://localhost:3000/auth/callback',
    )
    const [user] = await this.usersRepository.addMany([
      { id: authUser.id, email, status: 'invited' },
    ])
    if (!user) throw new Error('Invited test user was not created')
    const collaborator = await this.registerCollaborator(user, { profile: 'attendant' })
    return { user, collaborator }
  }

  async registerCollaborator(
    user: User,
    overrides: Partial<CollaboratorCreation> = {},
  ): Promise<Collaborator> {
    const draft = CollaboratorCreationFaker.administrative({
      userId: user.id,
      ...overrides,
    })
    const collaborator = await this.collaboratorsRepository.add(draft)

    if (!collaborator) throw new Error('Test collaborator was not created')
    return collaborator
  }

  async registerAdmin(overrides: Partial<AdministrativeCollaboratorCreation> = {}) {
    const user = await this.registerUser()
    const collaborator = await this.registerCollaborator(user, {
      profile: 'admin',
      ...overrides,
    })
    return { user, collaborator }
  }

  authenticateAs(user: User) {
    const token = this.accessTokens.get(user.id)
    if (!token) throw new Error('No Auth session was registered for the test user')
    return `Bearer ${token}`
  }

  credentialsFor(user: User) {
    const password = this.passwords.get(user.id)
    if (!password)
      throw new Error('No Auth credentials were registered for the test user')
    return { identifier: user.email, password }
  }

  clearAuthentication() {
    this.accessTokens.clear()
  }

  async registerClient(overrides: Partial<NaturalClientCreation> = {}) {
    const draft = ClientFaker.fake(overrides)

    const client = await this.clientsRepository.add({
      type: 'natural',
      name: draft.type === 'natural' ? draft.name : 'Cliente de teste',
      taxId: draft.type === 'natural' ? draft.taxId : ClientFaker.fake().taxId,
      phone: draft.phone,
      email: draft.email,
      address: draft.address,
    })

    if (!client) throw new Error('Test client was not created')
    return client
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

  seedLegalCatalog() {
    return this.legalCatalogSeeder.run()
  }

  registerConsents(consents: ClientConsentCreation[]) {
    return this.clientConsentsRepository.addMany(consents)
  }

  resetDatabase() {
    this.accessTokens.clear()
    this.passwords.clear()
    return this.restFixture.resetDatabase()
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      await this.authFixture.close()
    }
  }
}
