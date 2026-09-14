import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fakeFormalization,
  fakeFormalizationSignatureInvitation,
  fakeFormalizationSignatureRecipient,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'
import type { FormalizationSignatureInvitation } from '@hms/core/formalization/domain/entities'
import type {
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'

describe('Resend Formalization Signature Invitation Controller [POST /formalizations/:formalizationId/signature-sending/recipients/:recipientId/resend]', () => {
  let fixture: FormalizationModuleFixture
  let requestsRepository: FormalizationSignatureRequestsRepository
  let recipientsRepository: FormalizationSignatureRecipientsRepository
  let snapshotsRepository: FormalizationSignatureSnapshotsRepository
  let previousInvitation: FormalizationSignatureInvitation

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register((builder) =>
      builder
        .overrideProvider(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
        .useValue({
          encrypt: vi.fn().mockResolvedValue({
            ciphertext: new Uint8Array([1, 2, 3]),
            keyId: 'fixture-key',
          }),
        })
        .overrideProvider(FORMALIZATION_PROVIDERS.signatureSecretHasher)
        .useValue({ hash: vi.fn().mockReturnValue('a'.repeat(64)) })
        .overrideProvider(FORMALIZATION_PROVIDERS.signatureSecretGenerator)
        .useValue({ generate: vi.fn().mockReturnValue('fixture-invitation-token') }),
    )
    requestsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRequests)
    recipientsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRecipients)
    snapshotsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureSnapshots)
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    fixture.broker.publish.mockClear()
    fixture.sourceReader.findPerson.mockReset()
  })

  afterAll(async () => fixture?.close())

  it('rejects malformed identifiers before dispatching a resend', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post(
        '/formalizations/not-a-uuid/signature-sending/recipients/00000000-0000-4000-8000-000000000201/resend',
      )
      .send({ expectedRecipientVersion: 1, expectedInvitationGeneration: 1 })

    expect(response.status).toBe(400)
  })

  it('creates the next invitation and publishes its post-commit delivery event', async () => {
    const seeded = await seedResendScenario()
    fixture.sourceReader.findPerson.mockResolvedValue({
      personId: seeded.personId,
      name: 'Signatário de teste',
      email: 'f@hms.test',
      availableChannels: ['email'],
    })

    const response = await request(fixture.app.getHttpServer())
      .post(
        `/formalizations/${seeded.formalizationId}/signature-sending/recipients/${seeded.recipientId}/resend`,
      )
      .send({ expectedRecipientVersion: 1, expectedInvitationGeneration: 1 })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      requestId: seeded.requestId,
      recipientId: seeded.recipientId,
      invitationId: expect.any(String),
      generation: 2,
      deliveryPending: true,
    })
    await expect(
      recipientsRepository.findById(seeded.recipientId),
    ).resolves.toMatchObject({ status: 'invited', version: 2 })
    await expect(
      fixture.app
        .get(FORMALIZATION_REPOSITORIES.signatureInvitations)
        .findById(response.body.invitationId),
    ).resolves.toMatchObject({ generation: 2, status: 'active' })
    await expect(
      fixture.app
        .get(FORMALIZATION_REPOSITORIES.signatureInvitations)
        .findById(previousInvitation.id),
    ).resolves.toMatchObject({ status: 'revoked', revocationReason: 'resent' })
    expect(fixture.broker.publish).toHaveBeenCalledOnce()
  })

  it('rejects a resend when the requested invitation generation is stale', async () => {
    const seeded = await seedResendScenario()
    fixture.sourceReader.findPerson.mockResolvedValue({
      personId: seeded.personId,
      name: 'Signatário de teste',
      email: 'f@hms.test',
      availableChannels: ['email'],
    })

    const response = await request(fixture.app.getHttpServer())
      .post(
        `/formalizations/${seeded.formalizationId}/signature-sending/recipients/${seeded.recipientId}/resend`,
      )
      .send({ expectedRecipientVersion: 1, expectedInvitationGeneration: 2 })

    expect(response.status).toBe(409)
    expect(fixture.broker.publish).not.toHaveBeenCalled()
  })

  async function seedResendScenario() {
    const formalizationId = fixture.idProvider.generate()
    const requestId = fixture.idProvider.generate()
    const recipientId = fixture.idProvider.generate()
    const signatoryId = fixture.idProvider.generate()
    const personId = fixture.idProvider.generate()
    const snapshot = fakeFormalizationSignatureSnapshot({
      formalizationId,
      createdBy: fixture.authUser.id,
    })
    const signatureRequest = fakeFormalizationSignatureRequest({
      id: requestId,
      formalizationId,
      snapshotId: snapshot.id,
      createdBy: fixture.authUser.id,
      status: 'sent',
    })

    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: fixture.collaboratorId,
      }),
    )
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
          personId,
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
    await recipientsRepository.addMany([
      fakeFormalizationSignatureRecipient({
        id: recipientId,
        requestId,
        signatoryId,
        personId,
        status: 'authenticated',
        deliveryChannel: 'email',
      }),
    ])
    previousInvitation = fakeFormalizationSignatureInvitation({
      requestId,
      recipientId,
      generation: 1,
      tokenHash: 'b'.repeat(64),
    })
    await fixture.app
      .get(FORMALIZATION_REPOSITORIES.signatureInvitations)
      .add(previousInvitation)

    return { formalizationId, requestId, recipientId, personId }
  }
})
