import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import { UnauthorizedException } from '@nestjs/common'
import type {
  ClientConsentCreation,
  ClientCreation,
  Collaborator,
  CollaboratorCreation,
  User,
  UserCreation,
} from '@hms/core/identity/domain/entities'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import {
  ClientFaker,
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { AuthModule } from '@/identity/auth.module'
import {
  DrizzleClientConsentsRepository,
  DrizzleCollaboratorsRepository,
  DrizzleClientsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

type NaturalClientCreation = Extract<ClientCreation, { type: 'natural' }>
type AdministrativeCollaboratorCreation = Extract<
  CollaboratorCreation,
  { profile: 'admin' | 'attendant' }
>

export class IdentityModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly clientsRepository: DrizzleClientsRepository,
    private readonly clientConsentsRepository: DrizzleClientConsentsRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly identitySeeder: IdentitySeeder,
    private readonly authentication: { user?: AuthUser },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller: Type<unknown>) {
    const authentication: { user?: AuthUser } = {}
    const restFixture = await RestFixture.register(
      {
        imports: [
          AuthModule,
          IdentityDatabaseModule,
          LegalCatalogModule,
          ProvisionModule,
        ],
        controllers: [controller],
        providers: [DatetimeProvider, ActiveAdminGuard],
      },
      (builder) =>
        builder.overrideGuard(AuthGuard).useValue({
          canActivate: (context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest<{
              headers: { authorization?: string }
              auth?: { accessToken: string; user: AuthUser }
              user?: AuthUser
              identity?: { auth: { accessToken: string; user: AuthUser }; user: AuthUser }
            }>()

            if (!authentication.user || !request.headers.authorization) {
              throw new UnauthorizedException('Authentication token is required')
            }

            const auth = {
              accessToken: 'fixture-access-token',
              user: authentication.user,
            }
            request.user = authentication.user
            request.auth = auth
            request.identity = { auth, user: authentication.user }
            return true
          },
        }),
    )

    return new IdentityModuleFixture(
      restFixture,
      restFixture.get(DrizzleClientsRepository),
      restFixture.get(DrizzleClientConsentsRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(IdentitySeeder),
      authentication,
    )
  }

  async registerUser(overrides: Partial<UserCreation> = {}) {
    const draft = UserFaker.fake({ status: 'active', ...overrides })
    const [user] = await this.usersRepository.addMany([
      {
        id: draft.id,
        email: draft.email,
        status: draft.status,
        lastAccessAt: draft.lastAccessAt,
      },
    ])

    if (!user) throw new Error('Test user was not created')
    return user
  }

  async registerCollaborator(
    user: User,
    overrides: Partial<AdministrativeCollaboratorCreation> = {},
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
    this.authentication.user = { id: user.id, email: user.email }
    return 'Bearer fixture-access-token'
  }

  clearAuthentication() {
    this.authentication.user = undefined
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
