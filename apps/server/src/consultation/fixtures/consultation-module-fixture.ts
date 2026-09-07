import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import { UnauthorizedException } from '@nestjs/common'
import type { Consultation } from '@hms/core/consultation/domain/entities'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import type { DocumentGenerationCreation } from '@hms/core/document-production/domain/entities'
import { DocumentGenerationFaker } from '@hms/core/document-production/domain/entities/fakers'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { User, UserCreation } from '@hms/core/identity/domain/entities'
import { UserFaker } from '@hms/core/identity/domain/entities/fakers'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type {
  ClientsRepository,
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import type { Broker } from '@hms/core/shared/interfaces'
import { vi, type Mock } from 'vitest'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IdentityModule } from '@/identity/identity.module'
import { AuthGuard } from '@/identity/guards'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SchedulingDatabaseModule } from '@/scheduling/database/scheduling-database.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class ConsultationModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    readonly broker: Broker & { publish: Mock },
    readonly consultationsRepository: ConsultationsRepository,
    readonly intakesRepository: IntakesRepository,
    readonly clientsRepository: ClientsRepository,
    readonly legalAreasRepository: LegalAreasRepository,
    readonly legalTopicsRepository: LegalTopicsRepository,
    readonly specificationsRepository: DocumentSpecificationsRepository,
    readonly documentsRepository: DocumentsRepository,
    readonly documentVersionsRepository: DocumentVersionsRepository,
    readonly documentPackagesRepository: DocumentPackagesRepository,
    readonly packageDocumentsRepository: PackageDocumentsRepository,
    readonly documentGenerationsRepository: DocumentGenerationsRepository,
    private readonly usersRepository: ReturnType<
      typeof ConsultationModuleFixture.resolveUsersRepository
    >,
    private readonly collaboratorsRepository: ReturnType<
      typeof ConsultationModuleFixture.resolveCollaboratorsRepository
    >,
    private readonly authentication: { user?: AuthUser },
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller: Type<unknown>) {
    const authentication: { user?: AuthUser } = {}
    const broker: Broker & { publish: Mock } = { publish: vi.fn() }
    const restFixture = await RestFixture.register(
      {
        imports: [
          IdentityModule,
          LegalCatalogModule,
          IntakeDatabaseModule,
          SchedulingDatabaseModule,
          ConsultationDatabaseModule,
          DocumentProductionDatabaseModule,
          DocumentProductionProvisionModule,
          ProvisionModule,
        ],
        controllers: [controller],
        providers: [{ provide: InngestBroker, useValue: broker }],
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
            request.user = authentication.user
            request.auth = {
              accessToken: 'fixture-access-token',
              user: authentication.user,
            }
            return true
          },
        }),
    )

    return new ConsultationModuleFixture(
      restFixture,
      broker,
      restFixture.get(CONSULTATION_REPOSITORIES.consultations),
      restFixture.get(INTAKE_REPOSITORIES.intakes),
      restFixture.get(IDENTITY_REPOSITORIES.clients),
      restFixture.get(LEGAL_CATALOG_REPOSITORIES.areas),
      restFixture.get(LEGAL_CATALOG_REPOSITORIES.topics),
      restFixture.get(DOCUMENT_PRODUCTION_REPOSITORIES.specifications),
      restFixture.get(DOCUMENT_PRODUCTION_REPOSITORIES.documents),
      restFixture.get(DOCUMENT_PRODUCTION_REPOSITORIES.versions),
      restFixture.get(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages),
      restFixture.get(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments),
      restFixture.get(DOCUMENT_PRODUCTION_REPOSITORIES.generations),
      ConsultationModuleFixture.resolveUsersRepository(restFixture),
      ConsultationModuleFixture.resolveCollaboratorsRepository(restFixture),
      authentication,
    )
  }

  async registerAssociatedCollaborator() {
    const user = await this.registerUser()
    const collaborator = await this.collaboratorsRepository.add({
      userId: user.id,
      professionalName: 'Advogado de teste',
      jobTitle: 'Advogado',
      profile: 'admin',
    })
    if (!collaborator) throw new Error('Test collaborator was not created')
    this.authentication.user = { id: user.id, email: user.email }
    return { user, collaborator }
  }

  authenticateAs(user: User) {
    this.authentication.user = { id: user.id, email: user.email }
    return 'Bearer fixture-access-token'
  }

  async seedConsultation(consultation: Consultation) {
    const client = await this.clientsRepository.add({
      type: 'natural',
      name: 'Cliente de teste',
      taxId: { type: 'cpf', value: '52998224725' },
      email: 'cliente.consulta@example.com',
    })
    if (!client) throw new Error('Test client was not created')

    const [legalArea] = await this.legalAreasRepository.addMany([
      { name: 'Direito Civil', active: true },
    ])
    if (!legalArea) throw new Error('Test legal area was not created')
    const [legalTopic] = await this.legalTopicsRepository.addMany([
      {
        legalAreaId: legalArea.id,
        name: 'Locação residencial',
        active: true,
      },
    ])
    if (!legalTopic) throw new Error('Test legal topic was not created')

    const consultationContext = {
      ...consultation,
      clientId: client.id,
      legalAreaId: legalArea.id,
      legalTopicId: legalTopic.id,
    }
    await this.intakesRepository.addMany([
      {
        clientId: consultationContext.clientId,
        responsibleId: consultationContext.assignedLawyerId,
        createdBy: consultationContext.assignedLawyerId,
        updatedBy: consultationContext.assignedLawyerId,
        origin: 'direct',
        contactChannel: 'email',
        legalAreaId: consultationContext.legalAreaId,
        legalTopicId: consultationContext.legalTopicId,
        urgency: 'normal',
        status: 'consultation_scheduled',
      },
    ])
    const [intake] = await this.intakesRepository.findByClientId(
      consultationContext.clientId,
    )
    if (!intake) throw new Error('Test intake was not created')

    const seededConsultation = { ...consultationContext, intakeId: intake.id }
    await this.consultationsRepository.addMany([seededConsultation])
    return seededConsultation
  }

  async seedDocument(consultationId: string) {
    const [specification] = await this.specificationsRepository.addMany([
      {
        name: 'Procuração',
        description: '',
        application: { scope: 'global', moment: 'consultation' },
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texto' }] }],
        } as unknown as DocumentTemplateContent,
        variables: [],
        status: 'available',
      },
    ])
    if (!specification) throw new Error('Test specification was not created')
    const document = await this.documentsRepository.add({
      id: 'a7b4f7c1-98e8-4f20-a5a6-30d35ee694d2',
      title: specification.name,
    })
    const documentPackage = await this.documentPackagesRepository.add({
      id: '6c42cf59-5102-4bb8-9513-a47c8ffea1e8',
      context: { type: 'consultation', consultationId },
    })
    await this.packageDocumentsRepository.add({
      id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
      documentPackageId: documentPackage.id,
      documentId: document.id,
      documentSpecificationId: specification.id,
    })
    return document
  }

  seedDocumentVersion(
    documentId: string,
    createdByCollaboratorId: string,
    overrides: Partial<Parameters<DocumentVersionsRepository['add']>[0]> = {},
  ) {
    return this.documentVersionsRepository.add({
      documentId,
      fileId: 'b4577479-b8ed-4b15-a7d7-ea9b99e0ed8f',
      versionNumber: 1,
      source: 'ai',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texto' }] }],
      } as unknown as DocumentTemplateContent,
      pendingMarkers: [],
      createdByCollaboratorId,
      createdAt: new Date('2026-08-12T18:00:00.000Z'),
      status: 'in_review',
      ...overrides,
    })
  }

  seedDocumentGeneration(
    documentId: string,
    requestedByCollaboratorId: string,
    overrides: Partial<DocumentGenerationCreation> = {},
  ) {
    const generation = DocumentGenerationFaker.fake({
      documentId,
      requestedByCollaboratorId,
      status: 'running',
      ...overrides,
      findings: overrides.findings ? [...overrides.findings] : [],
    })

    return this.documentGenerationsRepository.add({
      id: generation.id,
      documentId: generation.documentId,
      documentSpecificationVersionId: generation.documentSpecificationVersionId,
      requestedByCollaboratorId: generation.requestedByCollaboratorId,
      source: generation.source,
      template: generation.template,
      status: generation.status,
      attemptsCount: generation.attemptsCount,
      findings: generation.findings,
    })
  }

  resetDatabase() {
    this.broker.publish.mockReset()
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }

  private async registerUser(overrides: Partial<UserCreation> = {}) {
    const draft = UserFaker.fake({ status: 'active', ...overrides })
    const [user] = await this.usersRepository.addMany([draft])
    if (!user) throw new Error('Test user was not created')
    return user
  }

  private static resolveUsersRepository(restFixture: RestFixture) {
    return restFixture.get<UsersRepository>(IDENTITY_REPOSITORIES.users)
  }

  private static resolveCollaboratorsRepository(restFixture: RestFixture) {
    return restFixture.get<CollaboratorsRepository>(IDENTITY_REPOSITORIES.collaborators)
  }
}
