import type { INestApplication, Type } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { TestingModuleBuilder } from '@nestjs/testing'
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
  DrizzleDocumentPackagesRepository,
  DrizzleDocumentsRepository,
  DrizzleDocumentVersionsRepository,
  DrizzlePackageDocumentsRepository,
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
import { CaseManagementDatabaseModule } from '@/case-management/database'
import { CaseManagementAccessModule } from '@/case-management/access/case-management-access.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { IntakeDatabaseModule } from '@/intake/database'
import { SharedModule } from '@/shared/shared.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import {
  DrizzleLegalAreasRepository,
  DrizzleLegalTopicsRepository,
} from '@/legal-catalog/database/drizzle/repositories'
import { DrizzleIntakesRepository } from '@/intake/database/drizzle/repositories'
import { ClientFaker } from '@hms/core/identity/domain/entities/fakers'
import { LegalCaseFaker } from '@hms/core/case-management/domain/entities/fakers'
import type {
  LegalCasesRepository,
  CaseMembersRepository,
} from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'
import { eq } from 'drizzle-orm'

export class DocumentProductionModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly authFixture: SupabaseAuthFixture,
    readonly specificationsRepository: DrizzleDocumentSpecificationsRepository,
    readonly generationsRepository: DrizzleDocumentGenerationsRepository,
    readonly packagesRepository: DrizzleDocumentPackagesRepository,
    readonly packageDocumentsRepository: DrizzlePackageDocumentsRepository,
    readonly documentsRepository: DrizzleDocumentsRepository,
    readonly versionsRepository: DrizzleDocumentVersionsRepository,
    readonly specificationsSeeder: DocumentProductionSeeder,
    readonly legalCatalogSeeder: LegalCatalogSeeder,
    private readonly usersRepository: DrizzleUsersRepository,
    private readonly collaboratorsRepository: DrizzleCollaboratorsRepository,
    private readonly accessTokens: Map<string, string>,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(
    controller?: Type<unknown>,
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const authFixture = await SupabaseAuthFixture.register()
    const accessTokens = new Map<string, string>()
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        {
          imports: [
            IdentityModule,
            SharedModule,
            ProvisionModule,
            CaseManagementDatabaseModule,
            CaseManagementAccessModule,
            IntakeDatabaseModule,
            DocumentsModule,
            LegalCatalogModule,
            DocumentProductionDatabaseModule,
            ConsultationDatabaseModule,
            DocumentProductionProvisionModule,
            SharedMessagingModule,
          ],
          controllers: controller ? [controller] : [],
          providers: [DocumentProductionSeeder],
        },
        (builder) => {
          const authenticatedBuilder = authFixture.configure(builder)
          return configure?.(authenticatedBuilder) ?? authenticatedBuilder
        },
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
      restFixture.get(DrizzleDocumentPackagesRepository),
      restFixture.get(DrizzlePackageDocumentsRepository),
      restFixture.get(DrizzleDocumentsRepository),
      restFixture.get(DrizzleDocumentVersionsRepository),
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

  async registerLawyer() {
    const user = await this.registerUser()
    const { areas, topics } = await this.seedCatalog()
    const area = areas[0]
    const topic = topics.find(({ legalAreaId }) => legalAreaId === area?.id)
    if (!area || !topic) throw new Error('Legal expertise fixture was not created')
    const collaborator = await this.collaboratorsRepository.add({
      userId: user.id,
      professionalName: 'Advogado de teste',
      jobTitle: 'Advogado',
      profile: 'lawyer',
      legalExpertises: [{ legalAreaId: area.id, legalTopicIds: [topic.id] }],
    } satisfies CollaboratorCreation)
    if (!collaborator) throw new Error('Test lawyer was not created')
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

  async createCase(user: User, assignCurrentCollaborator = true) {
    const collaborator = await this.collaboratorsRepository.findByUserId(user.id)
    if (!collaborator) throw new Error('A collaborator is required for a Case fixture')
    const legalCase = await this.createLegalCase(user.id)
    if (assignCurrentCollaborator) {
      await this.assignCaseManager(legalCase.id, collaborator.id, user.id)
    }
    return legalCase
  }

  async setCollaboratorProfile(user: User, profile: 'admin' | 'attendant' | 'client') {
    const collaborator = await this.collaboratorsRepository.findByUserId(user.id)
    if (!collaborator) throw new Error('A collaborator is required for a profile fixture')
    const updated = await this.collaboratorsRepository.replace(collaborator.id, {
      professionalName: collaborator.professionalName,
      jobTitle: collaborator.jobTitle,
      profile,
    })
    if (!updated) throw new Error('Collaborator profile was not updated')
  }

  async closeCase(caseId: string) {
    await this.restFixture
      .get(DrizzleClient)
      .requireDatabase()
      .update(legalCaseModel)
      .set({ lifecycleStatus: 'closed' })
      .where(eq(legalCaseModel.id, caseId))
  }

  private async createLegalCase(userId: string) {
    const references = await this.createCaseReferences(userId)
    const draft = LegalCaseFaker.fake(references)
    const [legalCase] = await this.restFixture
      .get<LegalCasesRepository>(CASE_MANAGEMENT_REPOSITORIES.legalCases)
      .addMany([
        {
          publicCode: draft.publicCode,
          clientId: draft.clientId,
          intakeId: draft.intakeId,
          legalAreaId: draft.legalAreaId,
          legalTopicId: draft.legalTopicId,
          title: draft.title,
          lifecycleStatus: draft.lifecycleStatus,
          workflowStage: draft.workflowStage,
          teamVersion: draft.teamVersion,
          checklistCompletedAt: draft.checklistCompletedAt,
          checklistCompletedBy: draft.checklistCompletedBy,
          openedAt: draft.openedAt,
        },
      ])
    if (!legalCase) throw new Error('Legal case fixture was not created')
    return legalCase
  }

  private async createCaseReferences(userId: string) {
    const { legalAreaId, legalTopicId } = await this.createLegalReferences()
    const clientDraft = ClientFaker.fake()
    const client = await this.restFixture
      .get<ClientsRepository>(IDENTITY_REPOSITORIES.clients)
      .add({
        type: 'natural',
        name: clientDraft.name,
        taxId: clientDraft.taxId,
        phone: clientDraft.phone,
        email: clientDraft.email,
      })
    if (!client) throw new Error('Client fixture was not created')
    const intake = await this.restFixture.get(DrizzleIntakesRepository).add({
      clientId: client.id,
      responsibleId: userId,
      createdBy: userId,
      updatedBy: userId,
      origin: 'direct',
      contactChannel: 'whatsapp',
      urgency: 'normal',
      status: 'registered',
    })
    return { clientId: client.id, intakeId: intake.id, legalAreaId, legalTopicId }
  }

  private async createLegalReferences() {
    const [legalArea] = await this.restFixture
      .get(DrizzleLegalAreasRepository)
      .addMany([{ name: `Área ${randomUUID()}`, active: true }])
    if (!legalArea) throw new Error('Legal area fixture was not created')
    const [legalTopic] = await this.restFixture
      .get(DrizzleLegalTopicsRepository)
      .addMany([
        { legalAreaId: legalArea.id, name: `Assunto ${randomUUID()}`, active: true },
      ])
    if (!legalTopic) throw new Error('Legal topic fixture was not created')
    return { legalAreaId: legalArea.id, legalTopicId: legalTopic.id }
  }

  private async assignCaseManager(
    caseId: string,
    collaboratorId: string,
    userId: string,
  ) {
    await this.restFixture
      .get<CaseMembersRepository>(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
      .addMany([
        {
          caseId,
          collaboratorId,
          role: 'manager',
          assignedAt: new Date(),
          assignedBy: userId,
          archivedLegacy: false,
        },
      ])
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
