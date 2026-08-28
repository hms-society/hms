import type { ExecutionContext, INestApplication } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import type { Broker } from '@hms/core/shared/interfaces'
import type {
  DocumentPdfConverter,
  FormalizationDocumentPdfInspector,
  FormalizationSignatureSourceReader,
} from '@hms/core/formalization/interfaces'
import { vi, type Mock } from 'vitest'

import { FormalizationModule } from '@/formalization/formalization.module'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
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
    const sourceReader: FormalizationSignatureSourceReader = {
      findPerson: vi.fn().mockResolvedValue(null),
      listEligibleCandidates: vi.fn().mockResolvedValue({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
      }),
      listCurrentDocuments: vi.fn().mockResolvedValue([]),
      findCurrentDocument: vi.fn().mockResolvedValue(null),
      findDocumentVersion: vi.fn().mockResolvedValue(null),
    }
    const converter: DocumentPdfConverter = {
      convert: vi.fn().mockResolvedValue({
        contentType: 'application/pdf',
        content: new Uint8Array([37, 80, 68, 70]),
        converterVersion: 'fixture-converter',
      }),
    }
    const inspector: FormalizationDocumentPdfInspector = {
      inspect: vi.fn().mockResolvedValue({
        pageCount: 1,
        pages: [{ page: 1, width: 595, height: 842 }],
      }),
    }
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
          .overrideProvider(FORMALIZATION_PROVIDERS.signatureSourceReader)
          .useValue(sourceReader)
          .overrideProvider(FORMALIZATION_PROVIDERS.documentPdfConverter)
          .useValue(converter)
          .overrideProvider(FORMALIZATION_PROVIDERS.documentPdfInspector)
          .useValue(inspector)
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
