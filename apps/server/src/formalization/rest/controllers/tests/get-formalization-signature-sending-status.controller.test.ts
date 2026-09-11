import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FormalizationSignatureRequest } from '@hms/core/formalization/domain/entities'
import type {
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'
import {
  fakeFormalization,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Formalization Signature Sending Status Controller [GET /formalizations/:formalizationId/signature-sending/status]', () => {
  let fixture: FormalizationModuleFixture
  let requestsRepository: FormalizationSignatureRequestsRepository
  let requestDocumentsRepository: FormalizationSignatureRequestDocumentsRepository
  let snapshotsRepository: FormalizationSignatureSnapshotsRepository

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
    requestsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestDocumentsRepository = fixture.app.get(
      FORMALIZATION_REPOSITORIES.signatureRequestDocuments,
    )
    snapshotsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureSnapshots)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/not-a-uuid/signature-sending/status',
    )

    expect(response.status).toBe(400)
  })

  it('returns null when a Formalization has no signature request yet', async () => {
    const formalizationId = fixture.idProvider.generate()
    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: fixture.collaboratorId,
      }),
    )

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalizationId}/signature-sending/status`,
    )

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
  })

  it('returns the completed state of the latest confirmed request', async () => {
    const { formalizationId, requestId } = await seedSignatureRequest(
      'confirmed',
      'confirmed',
    )

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalizationId}/signature-sending/status`,
    )

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      formalizationId,
      formalizationStatus: 'in_progress',
      formalizationVersion: 1,
      requestId,
      status: 'confirmed',
      version: 1,
      totalDocuments: 1,
      completedDocuments: 1,
      failedDocuments: 0,
      canCancel: false,
      canRetry: false,
      canConfirmContracting: false,
      viewerMode: 'operator',
      permissions: { canOperate: true, canViewDocumentContent: false },
    })
    expect(response.body.documents).toHaveLength(1)
  })

  it('returns the status of an active request', async () => {
    const { formalizationId, requestId } = await seedSignatureRequest('sent')

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalizationId}/signature-sending/status`,
    )

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      formalizationId,
      formalizationStatus: 'in_progress',
      formalizationVersion: 1,
      requestId,
      status: 'sent',
      version: 1,
      totalDocuments: 1,
      completedDocuments: 0,
      failedDocuments: 0,
      canCancel: true,
      canRetry: false,
      canConfirmContracting: false,
      viewerMode: 'operator',
      permissions: { canOperate: true, canViewDocumentContent: false },
    })
    expect(response.body.documents).toHaveLength(1)
  })

  async function seedSignatureRequest(
    status: FormalizationSignatureRequest['status'],
    documentStatus: Parameters<
      typeof fakeFormalizationSignatureRequestDocument
    >[0]['status'] = 'pending',
  ) {
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
        status: documentStatus,
      }),
    ])

    return { formalizationId, requestId: signatureRequest.id }
  }
})
