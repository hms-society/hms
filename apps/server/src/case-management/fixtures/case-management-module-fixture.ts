import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import type {
  CaseMemberCreation,
  LegalCase,
  LegalCaseCreation,
} from '@hms/core/case-management/domain/entities'
import { LegalCaseFaker } from '@hms/core/case-management/domain/entities/fakers'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { ClientFaker, UserFaker } from '@hms/core/identity/domain/entities/fakers'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import {
  DrizzleCaseMembersRepository,
  DrizzleLegalCasesRepository,
} from '@/case-management/database/drizzle/repositories'
import {
  DrizzleClientsRepository,
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { IdentityModule } from '@/identity/identity.module'
import {
  DrizzleLegalAreasRepository,
  DrizzleLegalTopicsRepository,
} from '@/legal-catalog/database/drizzle/repositories'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

type RegisteredCollaborator = {
  collaboratorId: string
  professionalName: string
  clientId: string
  clientName: string
  legalAreaId: string
  legalAreaName: string
  legalTopicId: string
  legalTopicName: string
}

export class CaseManagementModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly legalCasesRepository: DrizzleLegalCasesRepository,
    private readonly caseMembersRepository: DrizzleCaseMembersRepository,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly clientsRepository: DrizzleClientsRepository,
    private readonly legalAreasRepository: DrizzleLegalAreasRepository,
    private readonly legalTopicsRepository: DrizzleLegalTopicsRepository,
    readonly authUser: AuthUser,
    private readonly currentCollaborator: { value?: RegisteredCollaborator },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const authUser: AuthUser = {
      id: '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30',
      email: 'case-management.fixture@hms.test',
    }
    const currentCollaborator: { value?: RegisteredCollaborator } = {}
    const restFixture = await RestFixture.register(
      {
        imports: [IdentityModule, LegalCatalogModule, CaseManagementDatabaseModule],
        controllers: controller ? [controller] : [],
      },
      (builder) =>
        builder
          .overrideGuard(AuthGuard)
          .useValue({
            canActivate: (context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest<{
                auth?: { accessToken: string; user: AuthUser }
                user?: AuthUser
              }>()
              request.user = authUser
              request.auth = { accessToken: 'fixture-access-token', user: authUser }
              return true
            },
          })
          .overrideGuard(ActiveCollaboratorGuard)
          .useValue({
            canActivate: (context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest<{
                collaborator?: {
                  collaboratorId: string
                  professionalName: string
                  email: string
                  profile: string
                  status: string
                }
              }>()
              const collaborator = currentCollaborator.value
              request.collaborator = {
                collaboratorId: collaborator?.collaboratorId ?? authUser.id,
                professionalName:
                  collaborator?.professionalName ?? 'Case Management Fixture',
                email: authUser.email ?? 'case-management.fixture@hms.test',
                profile: 'lawyer',
                status: 'active',
              }
              return true
            },
          }),
    )

    return new CaseManagementModuleFixture(
      restFixture,
      restFixture.get(DrizzleLegalCasesRepository),
      restFixture.get(DrizzleCaseMembersRepository),
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
      restFixture.get(DrizzleClientsRepository),
      restFixture.get(DrizzleLegalAreasRepository),
      restFixture.get(DrizzleLegalTopicsRepository),
      authUser,
      currentCollaborator,
    )
  }

  async registerCollaborator(): Promise<RegisteredCollaborator> {
    const [legalArea] = await this.legalAreasRepository.addMany([
      { name: 'Cível', active: true },
    ])
    if (!legalArea) throw new Error('Legal area fixture was not created')

    const [legalTopic] = await this.legalTopicsRepository.addMany([
      { legalAreaId: legalArea.id, name: 'Contratos', active: true },
    ])
    if (!legalTopic) throw new Error('Legal topic fixture was not created')

    const clientDraft = ClientFaker.fake({ name: 'Cliente HMS Teste' })
    const client = await this.clientsRepository.add({
      type: 'natural',
      name: clientDraft.type === 'natural' ? clientDraft.name : 'Cliente HMS Teste',
      taxId:
        clientDraft.type === 'natural' ? clientDraft.taxId : ClientFaker.fake().taxId,
      phone: clientDraft.phone,
      email: clientDraft.email,
      address: clientDraft.address,
    })
    if (!client) throw new Error('Client fixture was not created')

    const [user] = await this.usersRepository.addMany([
      UserFaker.fake({ id: this.authUser.id, email: this.authUser.email }),
    ])
    if (!user) throw new Error('User fixture was not created')

    const collaborator = await this.collaboratorsRepository.add({
      userId: user.id,
      professionalName: 'Advogado de desenvolvimento',
      jobTitle: 'Advogado',
      profile: 'lawyer',
      legalExpertises: [
        {
          legalAreaId: legalArea.id,
          legalTopicIds: [legalTopic.id],
        },
      ],
    })
    if (!collaborator) throw new Error('Collaborator fixture was not created')

    const registeredCollaborator = {
      collaboratorId: collaborator.id,
      professionalName: collaborator.professionalName,
      clientId: client.id,
      clientName:
        client.type === 'natural' ? client.name : (client.tradeName ?? client.legalName),
      legalAreaId: legalArea.id,
      legalAreaName: legalArea.name,
      legalTopicId: legalTopic.id,
      legalTopicName: legalTopic.name,
    }
    this.currentCollaborator.value = registeredCollaborator
    return registeredCollaborator
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

  async registerLegalCases(count: number) {
    const collaborator =
      this.currentCollaborator.value ?? (await this.registerCollaborator())
    return Promise.all(
      Array.from({ length: count }, () =>
        this.registerLegalCase({
          clientId: collaborator.clientId,
          legalAreaId: collaborator.legalAreaId,
          legalTopicId: collaborator.legalTopicId,
        }),
      ),
    )
  }

  registerCaseMembers(
    members: Array<
      Pick<CaseMemberCreation, 'caseId' | 'collaboratorId' | 'role' | 'isPrimary'>
    >,
  ) {
    return this.caseMembersRepository.addMany(
      members.map((member) => ({
        assignedAt: new Date('2026-08-25T12:00:00.000Z'),
        assignedBy: this.authUser.id,
        ...member,
      })),
    )
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
