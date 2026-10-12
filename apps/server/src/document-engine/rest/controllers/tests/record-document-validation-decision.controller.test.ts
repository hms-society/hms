import { randomUUID } from 'node:crypto'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { UserFaker } from '@hms/core/identity/domain/entities/fakers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type {
  CaseChecklistItemsRepository,
  CaseMembersRepository,
  PendingsRepository,
} from '@hms/core/case-management/interfaces'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { RecordDocumentValidationDecisionController } from '@/document-engine/rest/controllers/record-document-validation-decision.controller'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import {
  DocumentBatchChannel,
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Record Document Validation Decision Controller [PATCH /document-validation/documents/:documentFileId/decision]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      RecordDocumentValidationDecisionController,
      userId,
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('records a validation decision without writing mock labels into uuid columns', async () => {
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/comprovante-residencia.pdf',
          originalName: 'comprovante-residencia.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })

    const file = batch.files?.[0]
    expect(file).toBeDefined()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${file?.id}/decision`)
      .send({
        decision: DocumentValidationDecision.Validate,
        documentTypeId: 'case-0089',
        checklistRequirementId: 'residence-proof',
      })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.Valid,
        reviewedBy: userId,
      }),
    )
    expect(response.body.checklistLink.caseId).toBeUndefined()
    expect(response.body.checklistLink.checklistItemId).toBeUndefined()
    expect(response.body.humanCorrection).toEqual(
      expect.objectContaining({
        decision: DocumentValidationDecision.Validate,
        documentTypeId: 'case-0089',
        checklistRequirementId: 'residence-proof',
      }),
    )

    const logs = await fixture.documentValidationLogsRepository.listByDocumentFileId(
      file?.id ?? '',
    )

    expect(logs).toEqual([
      expect.objectContaining({
        documentFileId: file?.id,
        actorId: userId,
        action: DocumentValidationLogAction.DecisionRecorded,
        status: DocumentValidationStatus.Valid,
        decision: DocumentValidationDecision.Validate,
      }),
    ])
  })

  it('links a validated document to an authorized case checklist item', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: legalCase.id,
        templateItemKey: 'case-document-validation',
        title: 'Documento do caso',
        isRequired: true,
      },
    ])
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: legalCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/case-document.pdf',
          originalName: 'case-document.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })
    const file = batch.files?.[0]
    expect(checklistItem).toBeDefined()
    expect(file).toBeDefined()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${file?.id}/decision`)
      .send({
        decision: DocumentValidationDecision.Validate,
        caseId: legalCase.id,
        checklistRequirementId: checklistItem?.id,
      })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.Valid,
        checklistLink: expect.objectContaining({
          caseId: legalCase.id,
          checklistItemId: checklistItem?.id,
        }),
      }),
    )
    const [updatedItem] = await checklistItems.listByCaseId(legalCase.id)
    expect(updatedItem).toEqual(
      expect.objectContaining({
        id: checklistItem?.id,
        status: 'validated',
        documentFileId: file?.id,
      }),
    )
  })

  it('finds an existing checklist link by file when the decision has no case link', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: legalCase.id,
        templateItemKey: 'case-document-existing-file-link',
        title: 'Documento vinculado pela equipe',
        isRequired: true,
      },
    ])
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: legalCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/prelinked-proof.pdf',
          originalName: 'documento-previamente-vinculado.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })
    const file = batch.files?.[0]
    expect(checklistItem).toBeDefined()
    expect(file).toBeDefined()
    await checklistItems.markAsInAnalysisByDocument({
      checklistItemId: checklistItem?.id ?? '',
      documentFileId: file?.id ?? '',
      documentFileName: 'documento-previamente-vinculado.pdf',
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${file?.id}/decision`)
      .send({ decision: DocumentValidationDecision.Validate })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.Valid,
      }),
    )
    await expect(checklistItems.listByCaseId(legalCase.id)).resolves.toEqual([
      expect.objectContaining({
        id: checklistItem?.id,
        status: 'validated',
        documentFileId: file?.id,
      }),
    ])
  })

  it('rejects a checklist link when the Case client differs from the document batch', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: legalCase.id,
        templateItemKey: 'case-document-client-mismatch',
        title: 'Documento do cliente do Caso',
        isRequired: true,
      },
    ])
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/other-client-proof.pdf',
          originalName: 'documento-de-outro-cliente.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })
    const file = batch.files?.[0]
    expect(checklistItem).toBeDefined()
    expect(file).toBeDefined()

    await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${file?.id}/decision`)
      .send({
        decision: DocumentValidationDecision.Validate,
        caseId: legalCase.id,
        checklistRequirementId: checklistItem?.id,
      })
      .expect(403)

    await expect(checklistItems.listByCaseId(legalCase.id)).resolves.toEqual([
      expect.objectContaining({
        id: checklistItem?.id,
        status: 'pending',
        documentFileId: undefined,
      }),
    ])
  })

  it('links a rejected document to its checklist item and creates a pending follow-up', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: legalCase.id,
        templateItemKey: 'case-document-needs-correction',
        title: 'Documento completo',
        isRequired: true,
      },
    ])
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: legalCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/incomplete-proof.pdf',
          originalName: 'comprovante-incompleto.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })
    const file = batch.files?.[0]
    expect(checklistItem).toBeDefined()
    expect(file).toBeDefined()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${file?.id}/decision`)
      .send({
        decision: DocumentValidationDecision.Incomplete,
        caseId: legalCase.id,
        checklistRequirementId: checklistItem?.id,
        reason: 'Falta a página com a assinatura.',
      })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.Incomplete,
        checklistLink: expect.objectContaining({
          caseId: legalCase.id,
          checklistItemId: checklistItem?.id,
        }),
        humanCorrection: expect.objectContaining({
          reason: 'Falta a página com a assinatura.',
        }),
      }),
    )
    await expect(checklistItems.listByCaseId(legalCase.id)).resolves.toEqual([
      expect.objectContaining({
        id: checklistItem?.id,
        status: 'pending',
        documentFileId: file?.id,
        documentFileName: 'comprovante-incompleto.pdf',
      }),
    ])
    await expect(
      fixture.app
        .get<PendingsRepository>(CASE_MANAGEMENT_REPOSITORIES.pendings)
        .listByCaseId(legalCase.id),
    ).resolves.toEqual([
      expect.objectContaining({
        caseId: legalCase.id,
        checklistItemId: checklistItem?.id,
        documentFileId: file?.id,
        reason: 'incomplete',
        details: 'Falta a página com a assinatura.',
      }),
    ])
  })

  async function createSpoofingScenario(assignCaller: boolean) {
    const legalCase = await fixture.createCaseWithCurrentCollaborator(assignCaller)
    const collaborators = fixture.app.get<CollaboratorsRepository>(
      IDENTITY_REPOSITORIES.collaborators,
    )
    const actor = await collaborators.findByUserId(userId)
    expect(actor).toBeDefined()
    const managerUser = UserFaker.fake({ status: 'active' })
    await fixture.app
      .get<UsersRepository>(IDENTITY_REPOSITORIES.users)
      .addMany([
        { id: managerUser.id, email: managerUser.email, status: managerUser.status },
      ])
    const manager = await collaborators.add({
      userId: managerUser.id,
      professionalName: 'Outro Gestor',
      profile: 'lawyer',
      legalExpertises: [
        { legalAreaId: legalCase.legalAreaId, legalTopicIds: [legalCase.legalTopicId] },
      ],
    })
    if (!manager || !actor) throw new Error('Expected legal collaborator fixtures')
    const memberships = fixture.app.get<CaseMembersRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseMembers,
    )
    await memberships.addMany([
      {
        caseId: legalCase.id,
        collaboratorId: manager.id,
        role: 'manager',
        assignedAt: new Date(),
        assignedBy: manager.id,
        archivedLegacy: false,
      },
    ])
    const [item] = await fixture.app
      .get<CaseChecklistItemsRepository>(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
      .addMany([
        {
          caseId: legalCase.id,
          templateItemKey: 'spoofed-identity-regression',
          title: 'Documento do Caso',
          isRequired: true,
        },
      ])
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: legalCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: ['route-document.pdf', 'forged-document.pdf'].map((originalName) => ({
        storagePath: `client/${originalName}`,
        originalName,
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      })),
    })
    const [routeFile, forgedFile] = batch.files ?? []
    if (!item || !routeFile || !forgedFile) throw new Error('Expected document fixtures')
    await fixture.app
      .get<CaseChecklistItemsRepository>(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
      .markAsInAnalysisByDocument({
        checklistItemId: item.id,
        documentFileId: routeFile.id,
        documentFileName: routeFile.originalName,
      })
    return {
      legalCase,
      actor,
      manager,
      managerUser,
      memberships,
      item,
      routeFile,
      forgedFile,
    }
  }

  it.each([
    'unassigned',
    'revoked',
  ] as const)('rejects forged actor, reviewer and file fields from an %s caller without writes', async (membership) => {
    const scenario = await createSpoofingScenario(membership === 'revoked')
    const {
      legalCase,
      actor,
      manager,
      managerUser,
      memberships,
      item,
      routeFile,
      forgedFile,
    } = scenario
    if (membership === 'revoked') {
      const current = await memberships.findByCaseAndCollaborator(legalCase.id, actor.id)
      if (!current) throw new Error('Expected current membership')
      await memberships.replace(current.id, {
        removedAt: new Date(),
        removedBy: manager.id,
      })
    }
    const before = await Promise.all(
      [routeFile, forgedFile].map((file) =>
        fixture.documentValidationsRepository.findByFileId(file.id),
      ),
    )
    await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${routeFile.id}/decision`)
      .send({
        decision: DocumentValidationDecision.Validate,
        caseId: legalCase.id,
        checklistRequirementId: item.id,
        actorId: manager.id,
        reviewedBy: managerUser.id,
        documentFileId: forgedFile.id,
      })
      .expect(403)
    const after = await Promise.all(
      [routeFile, forgedFile].map((file) =>
        fixture.documentValidationsRepository.findByFileId(file.id),
      ),
    )
    expect(after).toEqual(before)
    for (const file of [routeFile, forgedFile]) {
      expect(
        await fixture.documentValidationLogsRepository.listByDocumentFileId(file.id),
      ).toEqual([])
    }
  })

  it('uses the authenticated reviewer and route file despite forged body fields', async () => {
    const { legalCase, manager, managerUser, item, routeFile, forgedFile } =
      await createSpoofingScenario(true)
    const forgedBefore = await fixture.documentValidationsRepository.findByFileId(
      forgedFile.id,
    )
    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${routeFile.id}/decision`)
      .send({
        decision: DocumentValidationDecision.Validate,
        caseId: legalCase.id,
        checklistRequirementId: item.id,
        actorId: manager.id,
        reviewedBy: managerUser.id,
        documentFileId: forgedFile.id,
      })
      .expect(200)
    expect(response.body).toMatchObject({ id: routeFile.id, reviewedBy: userId })
    expect(
      await fixture.documentValidationsRepository.findByFileId(forgedFile.id),
    ).toEqual(forgedBefore)
    expect(
      await fixture.documentValidationLogsRepository.listByDocumentFileId(routeFile.id),
    ).toEqual([
      expect.objectContaining({ actorId: userId, documentFileId: routeFile.id }),
    ])
    expect(
      await fixture.documentValidationLogsRepository.listByDocumentFileId(forgedFile.id),
    ).toEqual([])
  })
})
