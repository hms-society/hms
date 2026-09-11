import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import { UnauthorizedException } from '@nestjs/common'
import type {
  CaseMemberCreation,
  LegalCaseCreation,
} from '@hms/core/case-management/domain/entities'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import type {
  DrizzleCaseMembersRepository,
  DrizzleLegalCasesRepository,
} from '@/case-management/database/drizzle/repositories'
import { CaseManagementModule } from '@/case-management/case-management.module'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class CaseManagementModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    readonly legalCasesRepository: DrizzleLegalCasesRepository,
    readonly caseMembersRepository: DrizzleCaseMembersRepository,
    readonly collaboratorId: string,
    private readonly authentication: { user?: AuthUser },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const authentication: { user?: AuthUser } = {}
    const restFixture = await RestFixture.register(
      {
        imports: [CaseManagementModule],
        controllers: controller ? [controller] : [],
      },
      (builder) =>
        builder
          .overrideGuard(AuthGuard)
          .useValue({
            canActivate: (context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest<{
                headers: { authorization?: string }
                user?: AuthUser
              }>()

              if (!authentication.user || !request.headers.authorization) {
                throw new UnauthorizedException('Authentication token is required')
              }

              request.user = authentication.user
              return true
            },
          })
          .overrideGuard(ActiveCollaboratorGuard)
          .useValue({
            canActivate: (context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest<{
                collaborator?: unknown
              }>()
              request.collaborator = {
                collaboratorId: '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30',
                professionalName: 'Advogado da fixture',
                email: authentication.user?.email ?? 'case.fixture@hms.test',
                profile: 'lawyer',
                status: 'active',
                legalExpertises: [],
              }
              return true
            },
          }),
    )

    return new CaseManagementModuleFixture(
      restFixture,
      restFixture.get(CASE_MANAGEMENT_REPOSITORIES.legalCases),
      restFixture.get(CASE_MANAGEMENT_REPOSITORIES.caseMembers),
      '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30',
      authentication,
    )
  }

  authenticate() {
    this.authentication.user = {
      id: 'a1f9d3e7-8b2c-4d6e-9f10-223344556677',
      email: 'case.fixture@hms.test',
    }
    return 'Bearer fixture-access-token'
  }

  seedLegalCase(input: LegalCaseCreation) {
    return this.legalCasesRepository.addMany([input])
  }

  seedCaseMember(input: CaseMemberCreation) {
    return this.caseMembersRepository.addMany([input])
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }
}
