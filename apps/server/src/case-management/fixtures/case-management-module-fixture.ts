import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import type {
  LegalCase,
  LegalCaseCreation,
} from '@hms/core/case-management/domain/entities'
import { LegalCaseFaker } from '@hms/core/case-management/domain/entities/fakers'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import { DrizzleLegalCasesRepository } from '@/case-management/database/drizzle/repositories'
import { AuthGuard } from '@/identity/guards'
import { IdentityModule } from '@/identity/identity.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class CaseManagementModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly legalCasesRepository: DrizzleLegalCasesRepository,
    readonly authUser: AuthUser,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const authUser: AuthUser = {
      id: '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30',
      email: 'case-management.fixture@hms.test',
    }
    const restFixture = await RestFixture.register(
      {
        imports: [IdentityModule, CaseManagementDatabaseModule],
        controllers: controller ? [controller] : [],
      },
      (builder) =>
        builder.overrideGuard(AuthGuard).useValue({
          canActivate: (context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
            request.user = authUser
            return true
          },
        }),
    )

    return new CaseManagementModuleFixture(
      restFixture,
      restFixture.get(DrizzleLegalCasesRepository),
      authUser,
    )
  }

  async registerLegalCase(overrides: Partial<LegalCaseCreation> = {}) {
    const [legalCase] = await this.legalCasesRepository.addMany([
      this.createLegalCase(overrides),
    ])

    if (!legalCase) {
      throw new Error('Legal case fixture was not created')
    }

    return legalCase
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }

  private createLegalCase(overrides: Partial<LegalCaseCreation>): LegalCaseCreation {
    const draft: LegalCase = LegalCaseFaker.fake({
      status: LegalCaseStatus.Documentation,
      ...overrides,
    })

    return {
      publicCode: draft.publicCode,
      clientId: draft.clientId,
      intakeId: draft.intakeId,
      legalAreaId: draft.legalAreaId,
      legalTopicId: draft.legalTopicId,
      title: draft.title,
      status: draft.status,
      openedAt: draft.openedAt,
    }
  }
}
