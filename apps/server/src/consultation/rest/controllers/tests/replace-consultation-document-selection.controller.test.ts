import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

import { ConsultationModuleFixture } from '@/consultation/fixtures'
import { ReplaceConsultationDocumentSelectionController } from '@/consultation/rest/controllers'

describe('Replace Consultation Document Selection Controller [PUT /consultations/:consultationId/documents/selection]', () => {
  let fixture: ConsultationModuleFixture

  beforeAll(async () => {
    fixture = await ConsultationModuleFixture.register(
      ReplaceConsultationDocumentSelectionController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects an invalid selection payload', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )

    await request(fixture.app.getHttpServer())
      .put(`/consultations/${consultation.id}/documents/selection`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ documentSpecificationIds: ['not-a-uuid'] })
      .expect(400)
  })

  it('persists the selected models and materializes their documents', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    const [firstSpecification] = await fixture.specificationsRepository.addMany([
      {
        name: 'Procuração',
        description: 'Modelo principal',
        application: { scope: 'global', moment: 'consultation' },
        content: { type: 'doc', content: [] } as unknown as DocumentTemplateContent,
        variables: [],
        status: 'available',
      },
      {
        name: 'Declaração',
        description: 'Modelo complementar',
        application: { scope: 'global', moment: 'consultation' },
        content: { type: 'doc', content: [] } as unknown as DocumentTemplateContent,
        variables: [],
        status: 'available',
      },
    ])
    const specifications = await fixture.specificationsRepository.list({})
    const ids = specifications.items.map(
      ({ documentSpecificationId }) => documentSpecificationId,
    )

    const response = await request(fixture.app.getHttpServer())
      .put(`/consultations/${consultation.id}/documents/selection`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ documentSpecificationIds: ids })
      .expect(200)

    expect(firstSpecification).toBeDefined()
    expect(response.body.selectedDocumentSpecificationIds).toHaveLength(2)
    const documentPackage = await fixture.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    expect(documentPackage).toBeDefined()
    const packageDocuments =
      await fixture.packageDocumentsRepository.findByDocumentPackageId(
        documentPackage?.id ?? '',
      )
    expect(packageDocuments).toHaveLength(2)
    const selectedDocuments = await fixture.documentsRepository.findByIds(
      packageDocuments.map(({ documentId }) => documentId),
    )
    expect(selectedDocuments.map(({ title }) => title)).toContain('Declaração')
  })

  it('allows removing a model from a package when it has no versions', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    await fixture.specificationsRepository.addMany([
      {
        name: 'Procuração',
        description: 'Modelo principal',
        application: { scope: 'global', moment: 'consultation' },
        content: { type: 'doc', content: [] } as unknown as DocumentTemplateContent,
        variables: [],
        status: 'available',
      },
      {
        name: 'Declaração',
        description: 'Modelo complementar',
        application: { scope: 'global', moment: 'consultation' },
        content: { type: 'doc', content: [] } as unknown as DocumentTemplateContent,
        variables: [],
        status: 'available',
      },
    ])
    const specifications = await fixture.specificationsRepository.list({})
    const ids = specifications.items.map(
      ({ documentSpecificationId }) => documentSpecificationId,
    )

    await request(fixture.app.getHttpServer())
      .put(`/consultations/${consultation.id}/documents/selection`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ documentSpecificationIds: ids })
      .expect(200)

    await request(fixture.app.getHttpServer())
      .put(`/consultations/${consultation.id}/documents/selection`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ documentSpecificationIds: [ids[1]] })
      .expect(200)

    const documentPackage = await fixture.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    const packageDocuments =
      await fixture.packageDocumentsRepository.findByDocumentPackageId(
        documentPackage?.id ?? '',
      )
    expect(packageDocuments).toHaveLength(1)
    expect(packageDocuments[0]?.documentSpecificationId).toBe(ids[1])
  })

  it('rejects removing a model from a package when it has a version', async () => {
    const { user, collaborator } = await fixture.registerAssociatedCollaborator()
    const consultation = await fixture.seedConsultation(
      ConsultationFaker.fake({ assignedLawyerId: collaborator.id }),
    )
    await fixture.specificationsRepository.addMany([
      {
        name: 'Procuração',
        description: 'Modelo principal',
        application: { scope: 'global', moment: 'consultation' },
        content: { type: 'doc', content: [] } as unknown as DocumentTemplateContent,
        variables: [],
        status: 'available',
      },
      {
        name: 'Declaração',
        description: 'Modelo complementar',
        application: { scope: 'global', moment: 'consultation' },
        content: { type: 'doc', content: [] } as unknown as DocumentTemplateContent,
        variables: [],
        status: 'available',
      },
    ])
    const specifications = await fixture.specificationsRepository.list({})
    const ids = specifications.items.map(
      ({ documentSpecificationId }) => documentSpecificationId,
    )

    await request(fixture.app.getHttpServer())
      .put(`/consultations/${consultation.id}/documents/selection`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ documentSpecificationIds: ids })
      .expect(200)

    const documentPackage = await fixture.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    const packageDocuments =
      await fixture.packageDocumentsRepository.findByDocumentPackageId(
        documentPackage?.id ?? '',
      )
    const lockedPackageDocument = packageDocuments.find(
      ({ documentSpecificationId }) => documentSpecificationId === ids[0],
    )
    expect(lockedPackageDocument).toBeDefined()
    await fixture.seedDocumentVersion(
      lockedPackageDocument?.documentId ?? '',
      collaborator.id,
    )

    await request(fixture.app.getHttpServer())
      .put(`/consultations/${consultation.id}/documents/selection`)
      .set('Authorization', fixture.authenticateAs(user))
      .send({ documentSpecificationIds: [ids[1]] })
      .expect(400)

    const unchangedPackageDocuments =
      await fixture.packageDocumentsRepository.findByDocumentPackageId(
        documentPackage?.id ?? '',
      )
    expect(unchangedPackageDocuments).toHaveLength(2)
  })
})
