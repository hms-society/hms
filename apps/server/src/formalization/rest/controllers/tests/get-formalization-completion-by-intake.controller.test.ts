import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  fakeFormalization,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureSnapshot,
} from '@hms/core/formalization/domain/entities/fakers'
import type {
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'

describe('Get Formalization Completion By Intake Controller [GET /formalizations/by-intake/:intakeId/completion]', () => {
  let fixture: FormalizationModuleFixture
  let requestsRepository: FormalizationSignatureRequestsRepository
  let snapshotsRepository: FormalizationSignatureSnapshotsRepository

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
    requestsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureRequests)
    snapshotsRepository = fixture.app.get(FORMALIZATION_REPOSITORIES.signatureSnapshots)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects malformed intake identifiers at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/by-intake/not-a-uuid/completion',
    )

    expect(response.status).toBe(400)
  })

  it('returns the completed formalization summary after confirmed signature', async () => {
    const intakeId = fixture.idProvider.generate()
    const formalizationId = fixture.idProvider.generate()
    const snapshot = fakeFormalizationSignatureSnapshot({
      formalizationId,
      createdBy: fixture.authUser.id,
    })
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId,
      snapshotId: snapshot.id,
      createdBy: fixture.authUser.id,
      status: 'confirmed',
    })
    const completedAt = new Date('2026-09-08T12:00:00.000Z')

    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        intakeId,
        assignedLawyerId: fixture.collaboratorId,
        status: 'completed',
        completedAt,
        completedByCollaboratorId: fixture.collaboratorId,
        contractingConfirmationKey: fixture.idProvider.generate(),
        signatureRequestId: signatureRequest.id,
      }),
    )
    await snapshotsRepository.add(snapshot)
    await requestsRepository.add(signatureRequest)

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/by-intake/${intakeId}/completion`,
    )

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      formalizationId,
      intakeId,
      status: 'completed',
      completedAt: completedAt.toISOString(),
      signatureRequestId: signatureRequest.id,
      signatureStatus: 'confirmed',
    })
  })

  it('returns null when the intake has no completed formalization', async () => {
    const intakeId = fixture.idProvider.generate()

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/by-intake/${intakeId}/completion`,
    )

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
  })

  it('does not disclose a completion belonging to another lawyer', async () => {
    const intakeId = fixture.idProvider.generate()
    const formalizationId = fixture.idProvider.generate()
    const snapshot = fakeFormalizationSignatureSnapshot({ formalizationId })
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId,
      snapshotId: snapshot.id,
      status: 'confirmed',
    })

    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        intakeId,
        assignedLawyerId: fixture.idProvider.generate(),
        status: 'completed',
        signatureRequestId: signatureRequest.id,
      }),
    )
    await snapshotsRepository.add(snapshot)
    await requestsRepository.add(signatureRequest)

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/by-intake/${intakeId}/completion`,
    )

    expect(response.status).toBe(403)
  })
})
