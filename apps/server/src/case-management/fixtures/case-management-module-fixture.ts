import type { INestApplication, Type } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'
import type {
  CaseChecklistItemCreation,
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
  DrizzleCaseChecklistItemsRepository,
  DrizzleCaseMembersRepository,
  DrizzleLegalCasesRepository,
  DrizzlePendingsRepository,
  DrizzleCasePortalAccessGrantsRepository,
  DrizzleChecklistTemplatesRepository,
} from '@/case-management/database/drizzle/repositories'
import {
  DrizzleClientsRepository,
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { IntakeDatabaseModule } from '@/intake/database'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import { DrizzleIntakesRepository } from '@/intake/database/drizzle/repositories'
import { IdentityModule } from '@/identity/identity.module'
import { IdentityAccessModule } from '@/identity/identity-access.module'
import {
  DrizzleLegalAreasRepository,
  DrizzleLegalTopicsRepository,
} from '@/legal-catalog/database/drizzle/repositories'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'
import { ProvisionModule } from '@/shared/provision/provision.module'

type RegisteredCollaborator = {
  collaboratorId: string
  professionalName: string
  profile: string
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
    private readonly caseChecklistItemsRepository: DrizzleCaseChecklistItemsRepository,
    private readonly caseMembersRepository: DrizzleCaseMembersRepository,
    private readonly pendingsRepository: DrizzlePendingsRepository,
    private readonly grantsRepository: DrizzleCasePortalAccessGrantsRepository,
    private readonly templatesRepository: DrizzleChecklistTemplatesRepository,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly clientsRepository: DrizzleClientsRepository,
    private readonly legalAreasRepository: DrizzleLegalAreasRepository,
    private readonly legalTopicsRepository: DrizzleLegalTopicsRepository,
    private readonly intakesRepository: DrizzleIntakesRepository,
    readonly authUser: AuthUser,
    private readonly authFixture: SupabaseAuthFixture,
    private readonly currentCollaborator: { value?: RegisteredCollaborator },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(
    controller?: Type<unknown>,
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const authFixture = await SupabaseAuthFixture.register()
    const auth = await authFixture.createSignedInUser()
    const authUser: AuthUser = { id: auth.user.id, email: auth.user.email }
    const currentCollaborator: { value?: RegisteredCollaborator } = {}
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        {
          imports: [
            IdentityModule,
            IdentityAccessModule,
            LegalCatalogModule,
            CaseManagementDatabaseModule,
            IntakeDatabaseModule,
            ...(configure ? [DocumentsDatabaseModule, ProvisionModule] : []),
          ],
          controllers: controller ? [controller] : [],
        },
        (builder) => {
          const authenticatedBuilder = authFixture.configure(builder)
          return configure?.(authenticatedBuilder) ?? authenticatedBuilder
        },
        (app) => {
          app.use(
            (
              request: {
                headers: { authorization?: string }
              },
              _response: unknown,
              next: () => void,
            ) => {
              request.headers.authorization = `Bearer ${auth.accessToken}`
              next()
            },
          )
        },
      )
    } catch (error) {
      await authFixture.close()
      throw error
    }

    return new CaseManagementModuleFixture(
      restFixture,
      restFixture.get(DrizzleLegalCasesRepository),
      restFixture.get(DrizzleCaseChecklistItemsRepository),
      restFixture.get(DrizzleCaseMembersRepository),
      restFixture.get(DrizzlePendingsRepository),
      restFixture.get(DrizzleCasePortalAccessGrantsRepository),
      restFixture.get(DrizzleChecklistTemplatesRepository),
      restFixture.get(DrizzleUsersRepository),
      restFixture.get(DrizzleCollaboratorsRepository),
      restFixture.get(DrizzleClientsRepository),
      restFixture.get(DrizzleLegalAreasRepository),
      restFixture.get(DrizzleLegalTopicsRepository),
      restFixture.get(DrizzleIntakesRepository),
      authUser,
      authFixture,
      currentCollaborator,
    )
  }

  async registerCollaborator(
    overrides: {
      profile?: 'lawyer' | 'admin' | 'attendant' | 'supervisor' | 'paralegal' | 'intern'
    } = {},
  ): Promise<RegisteredCollaborator> {
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
      UserFaker.fake({
        id: this.authUser.id,
        email: this.authUser.email,
        status: 'active',
      }),
    ])
    if (!user) throw new Error('User fixture was not created')

    const collaborator = await this.collaboratorsRepository.add({
      userId: user.id,
      professionalName: 'Advogado de desenvolvimento',
      jobTitle: 'Advogado',
      profile: (overrides.profile ?? 'lawyer') as any,
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
      profile: collaborator.profile,
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

  async registerIntake(clientId: string) {
    const [intake] = await this.intakesRepository.addMany([
      {
        clientId,
        responsibleId: this.authUser.id,
        status: 'registered',
        contactChannel: 'whatsapp',
        origin: 'direct',
        createdBy: this.authUser.id,
        updatedBy: this.authUser.id,
        urgency: 'normal',
      },
    ])
    if (!intake) throw new Error('Intake fixture was not created')
    return intake
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
        permission: 'visualização',
        ...member,
      })),
    )
  }

  registerCaseChecklistItems(checklistItems: readonly CaseChecklistItemCreation[]) {
    return this.caseChecklistItemsRepository.addMany(checklistItems)
  }

  async registerPending(caseId: string, checklistItemId: string, responsibleId: string) {
    return this.pendingsRepository.createWithMessage({
      pending: { caseId, checklistItemId, responsibleId, reason: 'missing' },
      message: {
        caseId,
        checklistItemId,
        subject: 'Documento pendente',
        body: 'Envie o documento pendente.',
        status: 'awaiting_approval',
      },
    })
  }

  registerPortalGrant(
    caseId: string,
    tokenHash: string,
    grantedBy: string,
    canUpload = false,
  ) {
    return this.grantsRepository.add({
      caseId,
      tokenHash,
      canView: true,
      canUpload,
      expiresAt: new Date(Date.now() + 60_000),
      grantedBy,
    })
  }

  registerChecklistTemplate(legalAreaId: string) {
    return this.templatesRepository.add({
      legalAreaId,
      name: 'Documentos iniciais',
      isActive: true,
    })
  }

  findPending(pendingId: string) {
    return this.pendingsRepository.findById(pendingId)
  }

  findPendingMessage(pendingId: string) {
    return this.pendingsRepository.findMessageByPendingId(pendingId)
  }

  findPortalGrant(tokenHash: string, caseId: string) {
    return this.grantsRepository.findActiveByTokenHashAndCase(tokenHash, caseId)
  }

  findChecklistTemplate(legalAreaId: string) {
    return this.templatesRepository.findByLegalAreaId(legalAreaId)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      await this.authFixture.close()
    }
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
      checklistCompletedAt: draft.checklistCompletedAt,
      checklistCompletedBy: draft.checklistCompletedBy,
      openedAt: draft.openedAt,
    }
  }
}
