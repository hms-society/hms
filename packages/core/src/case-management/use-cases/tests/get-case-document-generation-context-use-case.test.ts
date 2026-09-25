import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentValidationDocumentFaker } from '../../../document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '../../../document-engine/domain/structures'
import { DocumentSpecificationStatus } from '../../../document-production/domain/structures'
import { PaginationResponse } from '../../../shared/responses/pagination-response'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import {
  CaseChecklistItemStatus,
  CaseChecklistGateDecision,
  LegalCaseStatus,
} from '../../domain/structures'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../../interfaces'
import type { DocumentValidationsRepository } from '../../../document-engine/interfaces'
import type { DocumentSpecificationsRepository } from '../../../document-production/interfaces'
import { GetCaseDocumentGenerationContextUseCase } from '../get-case-document-generation-context-use-case'

describe('Get Case Document Generation Context Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let checklist: MockProxy<CaseChecklistItemsRepository>
  let validations: MockProxy<DocumentValidationsRepository>
  let specifications: MockProxy<DocumentSpecificationsRepository>
  let useCase: GetCaseDocumentGenerationContextUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    checklist = mock<CaseChecklistItemsRepository>()
    validations = mock<DocumentValidationsRepository>()
    specifications = mock<DocumentSpecificationsRepository>()
    useCase = new GetCaseDocumentGenerationContextUseCase(
      cases,
      checklist,
      validations,
      specifications,
    )
  })

  it('returns only human-reviewed validated checklist files and compatible active templates', async () => {
    const caseId = '9d2977fa-cb81-40a3-aab0-c26dd051130d'
    const fileId = '22222222-2222-4222-8222-222222222222'
    const itemId = '33333333-3333-4333-8333-333333333333'
    const now = new Date('2026-09-24T12:00:00.000Z')
    const legalCase = LegalCaseFaker.fake({
      id: caseId,
      status: LegalCaseStatus.LegalProduction,
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      dossierGate: { homologatedAt: now },
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: caseId } as never])
    checklist.listByCaseId.mockResolvedValue([
      {
        id: itemId,
        caseId,
        templateItemKey: itemId,
        title: 'Comprovante de residência',
        isRequired: true,
        status: CaseChecklistItemStatus.Validated,
        documentFileId: fileId,
        documentFileName: 'conta.pdf',
        validatedAt: now,
        validatedBy: 'collaborator-id',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        caseId,
        templateItemKey: 'pending-item',
        title: 'CNIS',
        isRequired: true,
        status: CaseChecklistItemStatus.Pending,
        createdAt: now,
        updatedAt: now,
      },
    ])
    validations.list.mockResolvedValue([
      DocumentValidationDocumentFaker.fake({
        id: fileId,
        fileName: 'conta.pdf',
        status: DocumentValidationStatus.Valid,
        reviewedBy: 'collaborator-id',
        reviewedAt: now,
        checklistLink: { caseId, checklistItemId: itemId },
      }),
      DocumentValidationDocumentFaker.fake({
        id: '55555555-5555-4555-8555-555555555555',
        status: DocumentValidationStatus.Valid,
      }),
    ])
    specifications.list.mockResolvedValue(
      new PaginationResponse(
        [
          {
            documentSpecificationId: '66666666-6666-4666-8666-666666666666',
            name: 'Modelo previdenciário',
            description: 'Modelo legal',
            application: {
              scope: 'legal_context',
              moment: 'legal_production',
              legalAreaIds: [legalCase.legalAreaId],
              legalTopicIdsByArea: { [legalCase.legalAreaId]: [legalCase.legalTopicId] },
            },
            status: DocumentSpecificationStatus.Available,
          },
          {
            documentSpecificationId: '77777777-7777-4777-8777-777777777777',
            name: 'Modelo incompatível',
            description: 'Outra área',
            application: {
              scope: 'legal_context',
              moment: 'legal_production',
              legalAreaIds: ['88888888-8888-4888-8888-888888888888'],
              legalTopicIdsByArea: {},
            },
            status: DocumentSpecificationStatus.Available,
          },
        ],
        1,
        100,
        2,
        1,
      ),
    )

    const result = await useCase.execute({ caseId, collaboratorId: 'collaborator-id' })

    expect(result.canGenerate).toBe(true)
    expect(result.documents).toEqual([
      expect.objectContaining({
        id: fileId,
        checklistItemId: itemId,
        validationStatus: 'validated',
      }),
    ])
    expect(result.models.map(({ name }) => name)).toEqual(['Modelo previdenciário'])
  })
})
