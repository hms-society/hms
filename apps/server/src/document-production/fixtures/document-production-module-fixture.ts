import type { INestApplication, Type } from '@nestjs/common'
import type {
  CollaboratorCreation,
  User,
  UserCreation,
} from '@hms/core/identity/domain/entities'
import { UserFaker } from '@hms/core/identity/domain/entities/fakers'

import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import {
  DrizzleDocumentGenerationsRepository,
  DrizzleDocumentSpecificationsRepository,
} from '@/document-production/database/drizzle/repositories'
import { IdentityModule } from '@/identity/identity.module'
import {
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

export class DocumentProductionModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly authFixture: SupabaseAuthFixture,
    readonly specificationsRepository: DrizzleDocumentSpecificationsRepository,
    readonly generationsRepository: DrizzleDocumentGenerationsRepository,
    readonly specificationsSeeder: DocumentProductionSeeder,
    readonly legalCatalogSeeder: LegalCatalogSeeder,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly accessTokens: Map<string, string>,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const authFixture = await SupabaseAuthFixture.register()
    const accessTokens = new Map<string, string>()
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        {
          imports: [
            IdentityModule,
            LegalCatalogModule,
            DocumentProductionDatabaseModule,
            ConsultationDatabaseModule,
          ],
          controllers: controller ? [controller] : [],
          providers: [DocumentProductionSeeder],
        },
        (builder) => authFixture.configure(builder),
      )
    } catch (error) {
      await authFixture.close()
      throw error
    }

    return new DocumentProductionModuleFixture(
      restFixture,
      authFixture,
      restFixture.get(DrizzleDocumentSpecificationsRepository),
      restFixture.get(DrizzleDocumentGenerationsRepository),
      restFixture.get(DocumentProductionSeeder),
      restFixture.get(LegalCatalogSeeder),
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
      accessTokens,
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
    return user
  }

  authenticateAs(user: User) {
    const token = this.accessTokens.get(user.id)
    if (!token) throw new Error('No Auth session was registered for the test user')
    return `Bearer ${token}`
  }

  async seedCatalog() {
    return this.legalCatalogSeeder.run()
  }

  resetDatabase() {
    this.accessTokens.clear()
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
