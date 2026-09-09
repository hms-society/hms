import { FormalizationSignatureRequestProvisioningRequestedEvent } from '@hms/core/formalization/domain'
import {
  fakeFormalization,
  fakeFormalizationSignatureProvisioningAttempt,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'
import type {
  FormalizationSignatureProvisioningAttemptsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'
import { ProvisionFormalizationSignatureRequestDocumentJob } from '@/formalization/messaging/inngest/jobs/provision-formalization-signature-request-document-job'

describe('Provision Formalization Signature Request Document Job', () => {
  let fixture: FormalizationModuleFixture
  let attemptsRepository: FormalizationSignatureProvisioningAttemptsRepository
  let requestDocumentsRepository: FormalizationSignatureRequestDocumentsRepository
  let requestsRepository: FormalizationSignatureRequestsRepository
  let snapshotsRepository: FormalizationSignatureSnapshotsRepository

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register({
      inngestJob: ProvisionFormalizationSignatureRequestDocumentJob,
    })
    attemptsRepository = fixture.app.get(
      FORMALIZATION_REPOSITORIES.signatureProvisioningAttempts,
    )
    requestDocumentsRepository = fixture.app.get(
      FORMALIZATION_REPOSITORIES.signatureRequestDocuments,
    )
    requestsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRequests)
    snapshotsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureSnapshots)
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  it('registers the stable provisioning function and retry policy', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: ProvisionFormalizationSignatureRequestDocumentJob.ID,
      retries: 5,
    })
  })

  it('accepts the canonical versioned event before invoking the handler', async () => {
    const event = new FormalizationSignatureRequestProvisioningRequestedEvent({
      requestId: fixture.idProvider.generate(),
      provisioningAttemptId: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
      correlationId: fixture.idProvider.generate(),
    })

    expect(event.payload).toMatchObject({ version: 1 })

    const run = await fixture.runInngest({
      name: event.name,
      data: event.payload,
    })

    expect(run.status.toLowerCase()).toBe('failed')
    expect(run.function).toMatchObject({
      id: ProvisionFormalizationSignatureRequestDocumentJob.ID,
    })
  })

  it('marks deterministic application failures as non-retriable at the Inngest boundary', async () => {
    const seeded = await seedProvisioningAttemptWithoutConfiguration()
    const event = new FormalizationSignatureRequestProvisioningRequestedEvent({
      requestId: seeded.requestId,
      provisioningAttemptId: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now(),
      correlationId: fixture.idProvider.generate(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
    await expect(
      attemptsRepository.findByRequestId(seeded.requestId),
    ).resolves.toMatchObject({ status: 'pending', attempts: 0 })
  })

  async function seedProvisioningAttemptWithoutConfiguration() {
    const formalizationId = fixture.idProvider.generate()
    const snapshotId = fixture.idProvider.generate()
    const requestId = fixture.idProvider.generate()
    const requestDocumentId = fixture.idProvider.generate()
    const attemptId = fixture.idProvider.generate()
    const attemptToken = fixture.idProvider.generate()
    const now = fixture.datetimeProvider.now()
    const snapshot = fakeFormalizationSignatureSnapshot({
      id: snapshotId,
      formalizationId,
      snapshotHash: 'a'.repeat(64),
      createdBy: fixture.authUser.id,
      createdAt: now,
    })
    const signatureRequest = fakeFormalizationSignatureRequest({
      id: requestId,
      formalizationId,
      snapshotId,
      confirmationKeyHash: 'b'.repeat(64),
      createdBy: fixture.authUser.id,
      createdAt: now,
      updatedAt: now,
    })
    const requestDocument = fakeFormalizationSignatureRequestDocument({
      id: requestDocumentId,
      requestId,
      sourceDocumentId: fixture.idProvider.generate(),
      sourceDocumentVersionId: fixture.idProvider.generate(),
      signaturePreviewId: fixture.idProvider.generate(),
      unsignedPrivateFileId: fixture.idProvider.generate(),
      unsignedSha256: 'c'.repeat(64),
      byteCount: 4,
      pageCount: 1,
      createdAt: now,
      updatedAt: now,
    })
    const attempt = fakeFormalizationSignatureProvisioningAttempt({
      id: attemptId,
      requestId,
      attemptToken,
      createdAt: now,
      updatedAt: now,
    })

    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: fixture.collaboratorId,
      }),
    )
    await snapshotsRepository.add(snapshot)
    await requestsRepository.add(signatureRequest)
    await requestDocumentsRepository.addMany([requestDocument])
    await attemptsRepository.add(attempt)

    return { attemptId, attemptToken, requestDocumentId, requestId }
  }
})
