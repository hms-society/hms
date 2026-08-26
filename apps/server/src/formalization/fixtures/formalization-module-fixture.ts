import type { ExecutionContext, INestApplication } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import type { Broker } from '@hms/core/shared/interfaces'
import { vi, type Mock } from 'vitest'

import { FormalizationModule } from '@/formalization/formalization.module'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'

export class FormalizationModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    readonly authUser: AuthUser,
    readonly collaboratorId: string,
    readonly broker: Broker & { publish: Mock },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  get formalizationsRepository(): FormalizationsRepository {
    return this.restFixture.get(FORMALIZATION_REPOSITORIES.formalizations)
  }

  static async register(
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const collaboratorId = '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30'
    const authUser: AuthUser = {
      id: 'a1f9d3e7-8b2c-4d6e-9f10-223344556677',
      email: 'formalization.fixture@hms.test',
    }
    const broker: Broker & { publish: Mock } = { publish: vi.fn() }
    const restFixture = await RestFixture.register(
      {
        imports: [FormalizationModule],
        providers: [
          {
            provide: InngestBroker,
            useValue: broker,
          },
        ],
      },
      (builder) =>
        (configure?.(builder) ?? builder)
          .overrideGuard(AuthGuard)
          .useValue({
            canActivate: (context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
              request.user = authUser
              return true
            },
          })
          .overrideGuard(ActiveCollaboratorGuard)
          .useValue({
            canActivate: (context: ExecutionContext) => {
              const request = context
                .switchToHttp()
                .getRequest<{ collaborator?: unknown }>()
              request.collaborator = {
                collaboratorId,
                professionalName: 'Advogado da fixture',
                email: authUser.email,
                profile: 'lawyer',
                status: 'active',
                legalExpertises: [],
              }
              return true
            },
          }),
    )

    return new FormalizationModuleFixture(restFixture, authUser, collaboratorId, broker)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }
}
