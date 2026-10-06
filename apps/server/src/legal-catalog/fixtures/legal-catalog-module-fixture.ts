import type { INestApplication, Type } from '@nestjs/common'
import type {
  LegalAreaCreation,
  LegalTopicCreation,
} from '@hms/core/legal-catalog/domain/entities'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import type { AuthProvider } from '@hms/core/identity/interfaces'
import {
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'

import { AuthModule } from '@/identity/auth.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IdentityCollaboratorsDatabaseModule } from '@/identity/database/identity-collaborators-database.module'
import { IdentityUsersDatabaseModule } from '@/identity/database/identity-users-database.module'
import {
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { ActiveAdminGuard } from '@/identity/guards'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

export class LegalCatalogModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly authFixture: SupabaseAuthFixture,
    readonly areasRepository: LegalAreasRepository,
    readonly topicsRepository: LegalTopicsRepository,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller: Type<unknown>) {
    const authFixture = await SupabaseAuthFixture.register()
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        {
          imports: [
            LegalCatalogModule,
            AuthModule,
            LegalCatalogDatabaseModule,
            IdentityUsersDatabaseModule,
            IdentityCollaboratorsDatabaseModule,
          ],
          controllers: [controller],
          providers: [ActiveAdminGuard],
        },
        (builder) => authFixture.configure(builder),
      )
    } catch (error) {
      await authFixture.close()
      throw error
    }

    return new LegalCatalogModuleFixture(
      restFixture,
      authFixture,
      restFixture.get<LegalAreasRepository>(LEGAL_CATALOG_REPOSITORIES.areas),
      restFixture.get<LegalTopicsRepository>(LEGAL_CATALOG_REPOSITORIES.topics),
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
    )
  }

  async authenticate(profile: 'admin' | 'attendant' = 'admin') {
    const auth = await this.authFixture.createSignedInUser()
    const draft = UserFaker.fake({
      id: auth.user.id,
      email: auth.user.email,
      status: 'active',
    })
    const [user] = await this.usersRepository.addMany([
      {
        id: draft.id,
        email: draft.email,
        status: draft.status,
        lastAccessAt: draft.lastAccessAt,
      },
    ])
    await this.collaboratorsRepository.add(
      CollaboratorCreationFaker.administrative({
        userId: user.id,
        profile,
      }),
    )
    const session = await this.restFixture
      .get<AuthProvider>(IDENTITY_PROVIDERS.auth)
      .getSession(auth.accessToken)
    if (!session) throw new Error('Real Auth provider rejected the test session')
    return `Bearer ${auth.accessToken}`
  }

  async addAreas(areas: LegalAreaCreation[]) {
    return this.areasRepository.addMany(areas)
  }

  async addTopics(topics: LegalTopicCreation[]) {
    return this.topicsRepository.addMany(topics)
  }

  async resetDatabase() {
    await this.restFixture.resetDatabase()
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      await this.authFixture.close()
    }
  }
}
