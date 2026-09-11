import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FormalizationSignatureRequest } from '@hms/core/formalization/domain/entities'
import {
  fakeFormalization,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'
import type {
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Cancel Formalization Signature Sending Controller [POST /formalizations/:formalizationId/signature-sending/cancel]', () => {
  let fixture: FormalizationModuleFixture
  let requestsRepository: FormalizationSignatureRequestsRepository
  let requestDocumentsRepository: FormalizationSignatureRequestDocumentsRepository
  let snapshotsRepository: FormalizationSignatureSnapshotsRepository
  let cancellationsRepository: FormalizationSignatureCancellationAttemptsRepository

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
    requestsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestDocumentsRepository = fixture.app.get(
      FORMALIZATION_REPOSITORIES.signatureRequestDocuments,
    )
    snapshotsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureSnapshots)
    cancellationsRepository = fixture.app.get(
      FORMALIZATION_REPOSITORIES.signatureCancellationAttempts,
    )
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/formalizations/not-a-uuid/signature-sending/cancel')
      .send({ expectedRequestVersion: 9, expectedFormalizationVersion: 9 })

    expect(response.status).toBe(400)
  })

  it('rejects a non-positive expected version before application dispatch', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post(
        '/formalizations/00000000-0000-4000-8000-000000000701/signature-sending/cancel',
      )
      .send({ expectedRequestVersion: 0, expectedFormalizationVersion: 1 })

    expect(response.status).toBe(400)
  })

  it('cancels an active request through the real application path', async () => {
    const { formalizationId, requestId } = await seedSignatureRequest('sent')

    const response = await request(fixture.app.getHttpServer())
      .post(`/formalizations/${formalizationId}/signature-sending/cancel`)
      .send({
        expectedRequestVersion: 1,
        expectedFormalizationVersion: 1,
        reason: 'Cliente solicitou o cancelamento.',
      })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      requestId,
      outcome: 'scheduled',
      cancellationPending: true,
    })
    await expect(requestsRepository.findById(requestId)).resolves.toMatchObject({
      status: 'sent',
      cancellationRequestedAt: expect.any(Date),
    })
    await expect(
      cancellationsRepository.findByRequestId(requestId),
    ).resolves.toMatchObject({
      requestId,
      reason: 'Cliente solicitou o cancelamento.',
      status: 'pending',
    })
  })

  async function seedSignatureRequest(status: FormalizationSignatureRequest['status']) {
    const formalizationId = fixture.idProvider.generate()
    const snapshot = fakeFormalizationSignatureSnapshot({
      formalizationId,
      createdBy: fixture.authUser.id,
    })
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId,
      snapshotId: snapshot.id,
      createdBy: fixture.authUser.id,
      status,
    })

    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: fixture.collaboratorId,
      }),
    )
    await snapshotsRepository.add(snapshot)
    await requestsRepository.add(signatureRequest)
    await requestDocumentsRepository.addMany([
      fakeFormalizationSignatureRequestDocument({
        requestId: signatureRequest.id,
      }),
    ])

    return { formalizationId, requestId: signatureRequest.id }
  }
})
