import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fakeFormalization } from '@hms/core/formalization/domain/entities/fakers'

import { FormalizationModuleFixture } from '@/formalization/fixtures'

describe('Get Formalization Signature Configuration Controller [GET /formalizations/:formalizationId/signature-configuration]', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects an invalid Formalization identifier at the HTTP boundary', async () => {
    const response = await request(fixture.app.getHttpServer()).get(
      '/formalizations/not-a-uuid/signature-configuration',
    )

    expect(response.status).toBe(400)
  })

  it('returns the locked configuration when no signature configuration exists', async () => {
    const formalizationId = fixture.idProvider.generate()
    await fixture.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: fixture.collaboratorId,
      }),
    )

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalizationId}/signature-configuration`,
    )

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      formalizationId,
      version: 1,
      editable: false,
      status: 'initialization_required',
      signatories: [],
      documents: [],
      readiness: {
        ready: false,
        assignmentCount: 0,
        issues: [{ path: 'configuration', code: 'initialization_required' }],
      },
    })
  })

  it('returns source identity and available channels for signatories', async () => {
    const formalizationId = fixture.idProvider.generate()
    const preview = await fixture.seedPendingSignaturePreview({ formalizationId })
    const signatoryId = fixture.idProvider.generate()
    const personId = fixture.idProvider.generate()
    const assignmentId = fixture.idProvider.generate()
    const occurredAt = fixture.datetimeProvider.now()

    fixture.sourceProvider.findPerson.mockResolvedValue({
      personId,
      name: 'Cliente da formalização',
      type: 'natural',
      email: 'cliente@example.com',
      availableChannels: ['email'],
    })
    fixture.sourceProvider.listCurrentDocuments.mockResolvedValue([
      {
        documentId: preview.documentId,
        documentVersionId: preview.documentVersionId,
        documentSpecificationId: fixture.idProvider.generate(),
        name: 'Contrato principal',
        reviewStatus: 'approved',
        fileId: fixture.idProvider.generate(),
      },
    ])

    await fixture.signatureConfigurationRepository.replaceConfiguration({
      formalizationId,
      expectedFormalizationVersion: 1,
      actorId: fixture.collaboratorId,
      occurredAt,
      signatories: [
        {
          id: signatoryId,
          formalizationId,
          role: 'client',
          personId,
          position: 1,
          selectedChannels: ['email'],
          createdByCollaboratorId: fixture.collaboratorId,
          createdAt: occurredAt,
          updatedByCollaboratorId: fixture.collaboratorId,
          updatedAt: occurredAt,
        },
      ],
      assignments: [
        {
          id: assignmentId,
          formalizationId,
          signatoryId,
          documentId: preview.documentId,
          documentVersionId: preview.documentVersionId,
          createdByCollaboratorId: fixture.collaboratorId,
          createdAt: occurredAt,
        },
      ],
      fields: [],
    })

    const response = await request(fixture.app.getHttpServer()).get(
      `/formalizations/${formalizationId}/signature-configuration`,
    )

    expect(response.status).toBe(200)
    expect(response.body.signatories).toEqual([
      expect.objectContaining({
        signatoryId,
        personId,
        name: 'Cliente da formalização',
        availableChannels: ['email'],
      }),
    ])
    expect(response.body.documents).toEqual([
      expect.objectContaining({
        documentId: preview.documentId,
        name: 'Contrato principal',
      }),
    ])
  })
})
