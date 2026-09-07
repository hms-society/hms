import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import { UnauthorizedException } from '@nestjs/common'
import type {
  CollaboratorCreation,
  User,
  UserCreation,
} from '@hms/core/identity/domain/entities'
import { UserFaker } from '@hms/core/identity/domain/entities/fakers'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import { DrizzleDocumentSpecificationsRepository } from '@/document-production/database/drizzle/repositories'
import { IdentityModule } from '@/identity/identity.module'
import {
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { AuthGuard } from '@/identity/guards'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class DocumentProductionModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    readonly specificationsRepository: DrizzleDocumentSpecificationsRepository,
    readonly specificationsSeeder: DocumentProductionSeeder,
    readonly legalCatalogSeeder: LegalCatalogSeeder,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly authentication: { user?: AuthUser },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const authentication: { user?: AuthUser } = {}
    const restFixture = await RestFixture.register(
      {
        imports: [IdentityModule, LegalCatalogModule, DocumentProductionDatabaseModule],
        controllers: controller ? [controller] : [],
      },
      (builder) =>
        builder.overrideGuard(AuthGuard).useValue({
          canActivate: (context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest<{
              headers: { authorization?: string }
              user?: AuthUser
              auth?: { accessToken: string; user: AuthUser }
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
            return true
          },
        }),
    )

    return new DocumentProductionModuleFixture(
      restFixture,
      restFixture.get(DrizzleDocumentSpecificationsRepository),
      restFixture.get(DocumentProductionSeeder),
      restFixture.get(LegalCatalogSeeder),
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
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

  async registerAdmin() {
    const user = await this.registerUser()
    const collaborator = await this.collaboratorsRepository.add({
      userId: user.id,
      professionalName: 'Administrador de teste',
      jobTitle: 'Administrador',
      profile: 'admin',
    } satisfies CollaboratorCreation)
    if (!collaborator) throw new Error('Test administrator was not created')
    this.authentication.user = { id: user.id, email: user.email }
    return user
  }

  authenticateAs(user: User) {
    this.authentication.user = { id: user.id, email: user.email }
    return 'Bearer fixture-access-token'
  }

  async seedCatalog() {
    return this.legalCatalogSeeder.run()
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }
}
