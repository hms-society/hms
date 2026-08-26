import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import { ConsultationStatus } from '@hms/core/consultation/domain/structures'
import {
  DocumentGenerationFaker,
  DocumentPackageFaker,
  DocumentSpecificationFaker,
  DocumentVersionFaker,
  DocumentFaker,
  PackageDocumentFaker,
} from '@hms/core/document-production/domain/entities/fakers'
import { DocumentVersionStatus } from '@hms/core/document-production/domain/structures'
import { fakeFormalization } from '@hms/core/formalization/domain/entities/fakers'
import {
  FormalizationContractFormState,
  FormalizationStatus,
} from '@hms/core/formalization/domain/structures'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { ClientFaker, CollaboratorFaker } from '@hms/core/identity/domain/entities/fakers'
import type { FormalizationStartSource } from '@hms/core/formalization/interfaces'

import { FormalizationModuleFixture } from '@/formalization/fixtures'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'
import { ServerFormalizationSourceReader } from '@/formalization/provision'

describe('Formalization controllers', () => {
  let fixture: FormalizationModuleFixture

  beforeEach(async () => {
    fixture = await FormalizationModuleFixture.register()
    await fixture.resetDatabase()
  })

  afterEach(async () => {
    if (fixture) await fixture.close()
  })

  it('returns a stable not-found response without leaking protected content', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/00000000-0000-4000-8000-000000009999',
    )

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({
      statusCode: 404,
      message: 'Formalização não encontrada.',
      path: '/formalizations/00000000-0000-4000-8000-000000009999',
    })
    expect(response.body).not.toHaveProperty('contractFormSnapshot')
  })

  it('rejects an ineligible Intake through the real controller composition', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/by-intake/00000000-0000-4000-8000-000000009998/start')
      .send()

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      statusCode: 400,
      message: 'O Intake não está apto para iniciar uma formalização.',
    })
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })

  it('rolls back a newly created Formalization when the real Intake CAS fails', async () => {
    const persistedIntake = IntakeFaker.fake({
      status: IntakeStatus.ViabilityRegistered,
      version: 5,
      closureReason: undefined,
      closureNotes: undefined,
      closedAt: undefined,
    })
    const intake = { ...persistedIntake, version: 4 }
    await fixture.app.get(INTAKE_REPOSITORIES.intakes).add(persistedIntake)

    const client = ClientFaker.fake({ id: intake.clientId })
    const assignedLawyer = CollaboratorFaker.legal({ id: fixture.collaboratorId })
    const consultation = ConsultationFaker.fake({
      intakeId: intake.id,
      clientId: client.id,
      assignedLawyerId: assignedLawyer.id,
      status: ConsultationStatus.Completed,
      primaryLegalQuestion: 'Questão jurídica da fixture',
      guidanceProvided: 'Orientação registrada na fixture',
      completedAt: new Date('2026-08-24T12:00:00.000Z'),
    })
    const contractForm = {
      id: '00000000-0000-4000-8000-000000000901',
      name: 'Formulário de formalização da fixture',
      description: 'Fixture de teste',
      status: 'available' as const,
      contexts: [],
      fields: [],
      createdAt: new Date('2026-08-24T12:00:00.000Z'),
      updatedAt: new Date('2026-08-24T12:00:00.000Z'),
    }
    const source: FormalizationStartSource = {
      intake,
      consultation,
      client,
      assignedLawyer,
      contractForm,
    }

    vi.spyOn(
      fixture.app.get(ServerFormalizationSourceReader),
      'findStartSource',
    ).mockResolvedValue(source)

    const response = await request(fixture.app.getHttpServer())
      .post(`/formalizations/by-intake/${intake.id}/start`)
      .send()

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      statusCode: 409,
      message:
        'O Intake foi alterado por outro usuário. Recarregue os dados e tente novamente.',
    })
    expect(
      await fixture.formalizationsRepository.findByIntakeId(intake.id),
    ).toBeUndefined()
    await expect(
      fixture.app.get(INTAKE_REPOSITORIES.intakes).findById(intake.id),
    ).resolves.toMatchObject({
      status: IntakeStatus.ViabilityRegistered,
      version: persistedIntake.version,
    })
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })

  it('rejects document generation while the contract form is open', async () => {
    const formalization = fakeFormalization({
      id: '00000000-0000-4000-8000-000000000902',
      assignedLawyerId: fixture.collaboratorId,
      contractFormState: FormalizationContractFormState.Open,
    })
    await fixture.formalizationsRepository.addOrGet(formalization)

    const response = await request(fixture.app.getHttpServer())
      .post(
        `/formalizations/${formalization.id}/documents/00000000-0000-4000-8000-000000000903/generations`,
      )
      .send({})

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      statusCode: 409,
      message:
        'Feche o formulário de condições comerciais antes de operar os documentos.',
    })
  })

  it('rejects document selection for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      id: '00000000-0000-4000-8000-000000000904',
      assignedLawyerId: fixture.collaboratorId,
      status: FormalizationStatus.Cancelled,
      contractFormState: FormalizationContractFormState.Closed,
      cancelledAt: new Date('2026-08-24T12:00:00.000Z'),
      cancelledByCollaboratorId: fixture.collaboratorId,
    })
    await fixture.formalizationsRepository.addOrGet(formalization)

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalization.id}/documents/selection`,
    )

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      statusCode: 409,
      message: 'A formalização cancelada não pode operar documentos.',
    })
  })

  it('converges confirmation into the selection projection without rewriting history', async () => {
    const formalization = fakeFormalization({
      id: '00000000-0000-4000-8000-000000000905',
      assignedLawyerId: fixture.collaboratorId,
      contractFormState: FormalizationContractFormState.Closed,
      contractFormRevision: 3,
    })
    const specification = DocumentSpecificationFaker.fake({
      id: '00000000-0000-4000-8000-000000000906',
      status: 'available',
      application: { scope: 'global', moment: 'formalization' },
    })
    const document = DocumentFaker.fake({ id: '00000000-0000-4000-8000-000000000907' })
    const documentPackage = DocumentPackageFaker.fake({
      id: '00000000-0000-4000-8000-000000000908',
      context: { type: 'formalization', formalizationId: formalization.id },
    })
    const generation = DocumentGenerationFaker.fake({
      id: '00000000-0000-4000-8000-000000000910',
      documentId: document.id,
      documentSpecificationVersionId: specification.id,
      status: 'completed',
      source: {
        type: 'formalization',
        id: formalization.id,
        data: {
          formalization: {
            id: formalization.id,
            contractFormRevision: formalization.contractFormRevision,
          },
        },
      },
    })
    const version = DocumentVersionFaker.fake({
      id: '00000000-0000-4000-8000-000000000911',
      documentId: document.id,
      documentGenerationId: generation.id,
      status: DocumentVersionStatus.Approved,
      reviewedByCollaboratorId: fixture.collaboratorId,
      reviewedAt: new Date('2026-08-24T12:00:00.000Z'),
    })

    await fixture.formalizationsRepository.addOrGet(formalization)
    const persistedSpecification = await fixture.app
      .get(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
      .add(specification)
    const packageDocument = PackageDocumentFaker.fake({
      id: '00000000-0000-4000-8000-000000000909',
      documentPackageId: documentPackage.id,
      documentId: document.id,
      documentSpecificationId: persistedSpecification.id,
    })
    await fixture.app.get(DOCUMENT_PRODUCTION_REPOSITORIES.documents).add(document)
    await fixture.app
      .get(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
      .add(documentPackage)
    await fixture.app
      .get(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
      .add(packageDocument)
    await fixture.app.get(DOCUMENT_PRODUCTION_REPOSITORIES.generations).add(generation)
    await fixture.app.get(DOCUMENT_PRODUCTION_REPOSITORIES.versions).add(version)

    const persistedGeneration = await fixture.app
      .get(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
      .findById(generation.id)
    const persistedVersion = await fixture.app
      .get(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
      .findById(version.id)
    const sourceReader = fixture.app.get(ServerFormalizationSourceReader)
    vi.spyOn(sourceReader, 'findContext').mockResolvedValue({
      intake: IntakeFaker.fake({ id: formalization.intakeId }),
      consultation: consultationFor(formalization),
      client: ClientFaker.fake({ id: formalization.clientId }),
      assignedLawyer: CollaboratorFaker.legal({ id: fixture.collaboratorId }),
    })

    const confirmResponse = await request(fixture.app.getHttpServer())
      .patch(`/formalizations/${formalization.id}/documents/confirm`)
      .send({ expectedVersion: formalization.version })

    expect(confirmResponse.status).toBe(200)
    expect(confirmResponse.body).toMatchObject({
      id: formalization.id,
      documentsConfirmedByCollaboratorId: fixture.collaboratorId,
      documentsConfirmedRevision: formalization.contractFormRevision,
    })

    const selectionResponse = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalization.id}/documents/selection`,
    )

    expect(selectionResponse.status).toBe(200)
    expect(selectionResponse.body).toMatchObject({
      selectedDocumentSpecificationIds: [persistedSpecification.id],
      confirmedByCollaboratorId: fixture.collaboratorId,
      confirmedAt: expect.any(String),
    })
    expect(
      await fixture.app
        .get(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
        .findById(documentPackage.id),
    ).toMatchObject({ confirmedAt: undefined, confirmedByCollaboratorId: undefined })
    expect(
      await fixture.app
        .get(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
        .findById(generation.id),
    ).toEqual(persistedGeneration)
    expect(
      await fixture.app
        .get(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
        .findById(version.id),
    ).toEqual(persistedVersion)
  })

  it('persists a draft through HTTP and rejects a stale compare-and-swap', async () => {
    const formalization = fakeFormalization({
      assignedLawyerId: fixture.collaboratorId,
      contractFormAnswers: [],
      version: 1,
    })
    await fixture.formalizationsRepository.addOrGet(formalization)

    const firstResponse = await request(fixture.app.getHttpServer())
      .patch(`/formalizations/${formalization.id}/contract-form/draft`)
      .send({ expectedVersion: 1, answers: [] })

    expect(firstResponse.status).toBe(200)
    expect(firstResponse.body).toMatchObject({ id: formalization.id, version: 2 })

    const persisted = await fixture.formalizationsRepository.findById(formalization.id)
    expect(persisted).toMatchObject({ id: formalization.id, version: 2 })
    expect(fixture.broker.publish).not.toHaveBeenCalled()

    const staleResponse = await request(fixture.app.getHttpServer())
      .patch(`/formalizations/${formalization.id}/contract-form/draft`)
      .send({ expectedVersion: 1, answers: [] })

    expect(staleResponse.status).toBe(409)
    expect(staleResponse.body).toMatchObject({
      statusCode: 409,
      message: 'A formalização foi alterada por outra operação.',
    })
    expect(
      await fixture.formalizationsRepository.findById(formalization.id),
    ).toMatchObject({
      version: 2,
    })
  })

  it('replaces the contract form using the persisted legal context', async () => {
    const legalAreaId = '00000000-0000-4000-8000-000000000921'
    const legalTopicId = '00000000-0000-4000-8000-000000000922'
    const intake = IntakeFaker.fake({
      id: '00000000-0000-4000-8000-000000000923',
      status: IntakeStatus.InFormalization,
      legalAreaId,
      legalTopicId,
      closureReason: undefined,
      closureNotes: undefined,
      closedAt: undefined,
    })
    await fixture.app.get(INTAKE_REPOSITORIES.intakes).add(intake)

    const [replacementForm] = await fixture.app
      .get(DYNAMIC_FORMS_REPOSITORIES.dynamicForms)
      .addMany([
        {
          name: 'Ficha de substituição da fixture',
          description: 'Definição usada pela prova de persistência.',
          status: 'available',
          contexts: [
            {
              type: 'formalization',
              data: { legalAreaId, legalTopicIds: [legalTopicId] },
            },
          ],
          fields: [
            {
              id: '00000000-0000-4000-8000-000000000924',
              key: 'fixture_field',
              label: 'Campo da fixture',
              type: 'short_text',
              position: 1,
              required: true,
            },
          ],
        },
      ])

    const formalization = fakeFormalization({
      id: '00000000-0000-4000-8000-000000000925',
      intakeId: intake.id,
      assignedLawyerId: fixture.collaboratorId,
      legalAreaId,
      legalTopicId,
      contractFormAnswers: [{ fieldId: 'old-field', value: 'old answer' }],
      contractFormRevision: 4,
      version: 3,
    })
    await fixture.formalizationsRepository.addOrGet(formalization)

    const response = await request(fixture.app.getHttpServer())
      .put(`/formalizations/${formalization.id}/contract-form/definition`)
      .send({ expectedVersion: formalization.version, dynamicFormId: replacementForm.id })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: formalization.id,
      legalAreaId,
      legalTopicId,
      contractFormId: replacementForm.id,
      contractFormAnswers: [],
      contractFormRevision: 0,
      contractFormState: 'open',
      version: formalization.version + 1,
    })

    await expect(
      fixture.formalizationsRepository.findById(formalization.id),
    ).resolves.toMatchObject({
      legalAreaId,
      legalTopicId,
      contractFormId: replacementForm.id,
      contractFormAnswers: [],
      contractFormRevision: 0,
      version: formalization.version + 1,
    })
  })
})

function consultationFor(formalization: ReturnType<typeof fakeFormalization>) {
  return ConsultationFaker.fake({
    id: formalization.consultationId,
    intakeId: formalization.intakeId,
    clientId: formalization.clientId,
    assignedLawyerId: formalization.assignedLawyerId,
    status: ConsultationStatus.Completed,
  })
}
