import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { SaveManualCaseDocumentVersionController } from '@/document-production/rest/controllers'

describe('Save Manual Case Document Version Controller', () => {
  let fixture: DocumentProductionModuleFixture
  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      SaveManualCaseDocumentVersionController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('conceals writes for a case outside the collaborator team', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer, false)
    await request(fixture.app.getHttpServer())
      .post(
        `/cases/${legalCase.id}/documents/${randomUUID()}/versions/${randomUUID()}/manual`,
      )
      .set('Authorization', fixture.authenticateAs(lawyer))
      .send({ content: { type: 'doc', content: [] } })
      .expect(403)
  })

  it('denies administrators and ineligible team members before manual-version effects', async () => {
    const admin = await fixture.registerAdmin()
    const adminCase = await fixture.createCase(admin)
    await postManualVersion(adminCase.id, fixture.authenticateAs(admin)).expect(403)

    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer)
    await fixture.setCollaboratorProfile(lawyer, 'attendant')
    await postManualVersion(legalCase.id, fixture.authenticateAs(lawyer)).expect(403)
    await expect(
      fixture.packagesRepository.findByContext({ type: 'case', caseId: legalCase.id }),
    ).resolves.toBeUndefined()
  })

  it('denies a Closed Case before package lookup or manual-version creation', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer)
    await fixture.closeCase(legalCase.id)
    const documentId = randomUUID()

    await postManualVersion(
      legalCase.id,
      fixture.authenticateAs(lawyer),
      documentId,
    ).expect(403)
    await expect(
      fixture.packagesRepository.findByContext({ type: 'case', caseId: legalCase.id }),
    ).resolves.toBeUndefined()
    await expect(
      fixture.versionsRepository.findByDocumentIds([documentId]),
    ).resolves.toEqual([])
  })

  function postManualVersion(
    caseId: string,
    authorization: string,
    documentId = randomUUID(),
  ) {
    return request(fixture.app.getHttpServer())
      .post(`/cases/${caseId}/documents/${documentId}/versions/${randomUUID()}/manual`)
      .set('Authorization', authorization)
      .send({ content: { type: 'doc', content: [] } })
  }
})
