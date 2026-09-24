import type { Intake } from '@hms/core/intake/domain/entities'
import type { LegalCaseCreation } from '@hms/core/case-management/domain/entities'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { describe, expect, it, vi } from 'vitest'

import { CaseManagementSeeder } from '@/case-management/database/case-management-seeder'

describe('CaseManagementSeeder', () => {
  it('uses the intake demand to title a retirement case', async () => {
    let seededCases: readonly LegalCaseCreation[] = []
    const seeder = new CaseManagementSeeder(
      {
        addMany: vi.fn(async (legalCases: readonly LegalCaseCreation[]) => {
          seededCases = legalCases
          return []
        }),
      } as unknown as LegalCasesRepository,
      { addMany: vi.fn(async () => []) } as never,
      { addMany: vi.fn(async () => []) } as never,
      {
        add: vi.fn(async () => ({ id: 'checklist-template' })),
      } as never,
      { addMany: vi.fn(async () => []) } as never,
    )

    const intake = {
      id: 'vinicius-intake',
      clientId: 'vinicius-client',
      legalAreaId: 'previdenciary-area',
      legalTopicId: 'retirement-topic',
      demandNotes: 'Cliente solicita análise de aposentadoria por tempo de contribuição.',
    } as Intake

    await seeder.run({
      contractedIntakes: [intake],
      lawyerIds: ['lawyer'],
      paralegalIds: [],
      supervisorIds: [],
      internIds: [],
      actorId: 'actor',
      legalAreaId: 'previdenciary-area',
    })

    expect(seededCases[0]?.title).toBe('Aposentadoria por tempo de contribuição')
  })
})
