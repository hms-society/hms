import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { AuditEventWriter, DatetimeProvider } from '#shared/interfaces'
import { RecordDocumentVersionHomologationAuditUseCase } from '../record-document-version-homologation-audit-use-case'

describe('RecordDocumentVersionHomologationAuditUseCase', () => {
  let auditEventWriter: MockProxy<AuditEventWriter>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: RecordDocumentVersionHomologationAuditUseCase

  beforeEach(() => {
    auditEventWriter = mock<AuditEventWriter>()
    datetimeProvider = mock<DatetimeProvider>()
    ;(datetimeProvider.now as any).mockReturnValue(new Date('2026-10-15T12:00:00.000Z'))
    useCase = new RecordDocumentVersionHomologationAuditUseCase(
      auditEventWriter,
      datetimeProvider,
    )
  })

  it('records the final homologation with actor and version metadata', async () => {
    await useCase.execute({
      caseId: 'case-id',
      documentId: 'document-id',
      documentVersionId: 'version-id',
      homologationId: 'homologation-id',
      collaboratorId: 'collaborator-id',
      collaboratorProfile: 'lawyer',
      approvedByCollaboratorName: 'Dra. Teste',
      approvedByCollaboratorProfile: 'lawyer',
      approvedAt: new Date('2026-10-15T11:59:00.000Z'),
    })

    expect(auditEventWriter.add).toHaveBeenCalledWith({
      occurredAt: new Date('2026-10-15T12:00:00.000Z'),
      actorId: 'collaborator-id',
      actorProfile: 'lawyer',
      entityType: 'piece',
      entityId: 'document-id',
      action: 'homologated',
      origin: 'human',
      status: 'success',
      afterData: {
        caseId: 'case-id',
        documentVersionId: 'version-id',
        homologationId: 'homologation-id',
        approvedByCollaboratorName: 'Dra. Teste',
        approvedByCollaboratorProfile: 'lawyer',
        approvedAt: '2026-10-15T11:59:00.000Z',
      },
    })
  })
})
