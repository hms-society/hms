import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  fakeFormalization,
  fakeFormalizationSignatureArtifact,
  fakeFormalizationSignatureProtocol,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'
import type {
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'

describe('Confirm Formalization Contracting Controller [POST /formalizations/:formalizationId/contracting/confirm]', () => {
  let fixture: FormalizationModuleFixture
  let requestsRepository: FormalizationSignatureRequestsRepository
  let snapshotsRepository: FormalizationSignatureSnapshotsRepository
  let documentsRepository: FormalizationSignatureRequestDocumentsRepository
  let recipientsRepository: FormalizationSignatureRecipientsRepository
  let artifactsRepository: FormalizationSignatureArtifactsRepository
  let protocolsRepository: FormalizationSignatureProtocolsRepository

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
    requestsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRequests)
    snapshotsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureSnapshots)
    documentsRepository = fixture.app.get(
      FORMALIZATION_REPOSITORIES.signatureRequestDocuments,
    )
    recipientsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRecipients)
    artifactsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureArtifacts)
    protocolsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureProtocols)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects non-positive versions before application dispatch', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/00000000-0000-4000-8000-000000000301/contracting/confirm')
      .send({
        expectedFormalizationVersion: 0,
        expectedIntakeVersion: 1,
        expectedRequestVersion: 1,
        confirmationKey: '00000000-0000-4000-8000-000000000302',
      })

    expect(response.status).toBe(400)
  })

  it('contracts the Intake and completes the Formalization atomically', async () => {
    const seeded = await seedContractingScenario()
    const confirmationKey = '00000000-0000-4000-8000-000000000303'

    const response = await request(fixture.app.getHttpServer())
      .post(`/formalizations/${seeded.formalizationId}/contracting/confirm`)
      .send({
        expectedFormalizationVersion: seeded.formalizationVersion,
        expectedIntakeVersion: 1,
        expectedRequestVersion: 1,
        confirmationKey,
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      formalizationId: seeded.formalizationId,
      formalizationStatus: 'completed',
      formalizationVersion: seeded.formalizationVersion + 1,
      intakeId: seeded.intakeId,
      intakeStatus: 'contracted',
      intakeVersion: 2,
      duplicate: false,
    })
    expect(response.body.contractedAt).toEqual(expect.any(String))
    await expect(
      fixture.formalizationsRepository.findById(seeded.formalizationId),
    ).resolves.toMatchObject({
      status: 'completed',
      contractingConfirmationKey: confirmationKey,
    })
    await expect(
      fixture.app.get(INTAKE_REPOSITORIES.intakes).findById(seeded.intakeId),
    ).resolves.toMatchObject({ status: IntakeStatus.Contracted, version: 2 })

    const duplicateResponse = await request(fixture.app.getHttpServer())
      .post(`/formalizations/${seeded.formalizationId}/contracting/confirm`)
      .send({
        expectedFormalizationVersion: seeded.formalizationVersion,
        expectedIntakeVersion: 1,
        expectedRequestVersion: 1,
        confirmationKey,
      })

    expect(duplicateResponse.status).toBe(201)
    expect(duplicateResponse.body).toMatchObject({
      formalizationId: seeded.formalizationId,
      intakeId: seeded.intakeId,
      intakeStatus: 'contracted',
      intakeVersion: 2,
      contractedAt: response.body.contractedAt,
      duplicate: true,
    })
  })

  async function seedContractingScenario() {
    const intakeId = fixture.idProvider.generate()
    const formalizationId = fixture.idProvider.generate()
    const requestId = fixture.idProvider.generate()
    const signatoryId = fixture.idProvider.generate()
    const recipientId = fixture.idProvider.generate()
    const documentId = fixture.idProvider.generate()
    const snapshot = fakeFormalizationSignatureSnapshot({
      formalizationId,
      createdBy: fixture.authUser.id,
    })
    const signatureRequest = fakeFormalizationSignatureRequest({
      id: requestId,
      formalizationId,
      snapshotId: snapshot.id,
      createdBy: fixture.authUser.id,
      status: 'confirmed',
    })
    const document = fakeFormalizationSignatureRequestDocument({
      id: documentId,
      requestId,
      status: 'confirmed',
    })
    const recipient = fakeFormalizationSignatureRecipient({
      id: recipientId,
      requestId,
      signatoryId,
      status: 'confirmed',
    })
    const intake = IntakeFaker.fake({
      id: intakeId,
      status: IntakeStatus.InFormalization,
      version: 1,
      contractedAt: undefined,
      closureReason: undefined,
      closureNotes: undefined,
      closedAt: undefined,
    })
    const formalization = fakeFormalization({
      id: formalizationId,
      intakeId,
      assignedLawyerId: fixture.collaboratorId,
      signatureRequestId: requestId,
      version: 1,
    })

    await fixture.app.get(INTAKE_REPOSITORIES.intakes).add(intake)
    await fixture.formalizationsRepository.addOrGet(formalization)
    await snapshotsRepository.add(snapshot)
    await requestsRepository.add(signatureRequest)
    await fixture.signatureConfigurationRepository.replaceConfiguration({
      formalizationId,
      expectedFormalizationVersion: 1,
      actorId: fixture.collaboratorId,
      occurredAt: new Date('2026-09-08T12:00:00.000Z'),
      signatories: [
        {
          id: signatoryId,
          formalizationId,
          personId: fixture.idProvider.generate(),
          role: 'client',
          position: 1,
          selectedChannels: ['email'],
          createdByCollaboratorId: fixture.collaboratorId,
          createdAt: new Date('2026-09-08T12:00:00.000Z'),
          updatedByCollaboratorId: fixture.collaboratorId,
          updatedAt: new Date('2026-09-08T12:00:00.000Z'),
        },
      ],
      assignments: [],
      fields: [],
    })
    await documentsRepository.addMany([document])
    await recipientsRepository.addMany([recipient])
    await artifactsRepository.add(
      fakeFormalizationSignatureArtifact({
        requestId,
        requestDocumentId: documentId,
        kind: 'signed_pdf',
      }),
    )
    await protocolsRepository.add(
      fakeFormalizationSignatureProtocol({ requestId, recipientId }),
    )

    return {
      formalizationId,
      formalizationVersion: 2,
      intakeId,
    }
  }
})
