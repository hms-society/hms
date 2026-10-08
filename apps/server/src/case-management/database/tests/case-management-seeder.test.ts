import type { Intake } from '@hms/core/intake/domain/entities'
import type { LegalCaseCreation } from '@hms/core/case-management/domain/entities'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { describe, expect, it, vi } from 'vitest'

import {
  CaseManagementSeeder,
  type CaseManagementSeedReferences,
} from '@/case-management/database/case-management-seeder'

const createIntake = (overrides: Partial<Intake> = {}): Intake =>
  ({
    id: 'intake-1',
    clientId: 'client-1',
    legalAreaId: 'area-1',
    legalTopicId: 'topic-1',
    ...overrides,
  }) as Intake

const createReferences = (
  overrides: Partial<CaseManagementSeedReferences> = {},
): CaseManagementSeedReferences => ({
  contractedIntakes: [createIntake()],
  lawyerIds: ['lawyer-1'],
  paralegalIds: [],
  supervisorIds: [],
  internIds: [],
  actorId: 'actor-1',
  legalAreaId: 'area-1',
  ...overrides,
})

const createSeeder = () => {
  const clearCalls: string[] = []
  const legalCasesRepository = {
    addMany: vi.fn(async (seeds: readonly LegalCaseCreation[]) =>
      seeds.map((seed, index) => ({ ...seed, id: `case-${index + 1}` })),
    ),
    removeAll: vi.fn(async () => {
      clearCalls.push('legal-cases')
    }),
  }
  const caseMembersRepository = {
    addMany: vi.fn(async (seeds: readonly unknown[]) => seeds),
    removeAll: vi.fn(async () => {
      clearCalls.push('case-members')
    }),
  }
  const caseTeamHistoriesRepository = {
    removeAll: vi.fn(async () => {
      clearCalls.push('team-histories')
    }),
  }
  const caseTeamOperationsRepository = {
    removeAll: vi.fn(async () => {
      clearCalls.push('team-operations')
    }),
  }
  const caseChecklistItemsRepository = {
    addMany: vi.fn(async (seeds: readonly unknown[]) => seeds),
    removeAll: vi.fn(async () => {
      clearCalls.push('checklist-items')
    }),
  }
  const checklistTemplatesRepository = {
    add: vi.fn(async (seed: { name: string }) => ({ ...seed, id: 'template-1' })),
  }
  const checklistTemplateItemsRepository = {
    addMany: vi.fn(async (seeds: readonly { title: string }[]) =>
      seeds.map((seed, index) => ({
        ...seed,
        id: `template-item-${index + 1}`,
        isRequired: true,
      })),
    ),
  }

  return {
    seeder: new CaseManagementSeeder(
      legalCasesRepository as unknown as LegalCasesRepository,
      caseMembersRepository as never,
      caseTeamHistoriesRepository as never,
      caseTeamOperationsRepository as never,
      caseChecklistItemsRepository as never,
      checklistTemplatesRepository as never,
      checklistTemplateItemsRepository as never,
    ),
    repositories: {
      legalCasesRepository,
      caseMembersRepository,
      caseTeamHistoriesRepository,
      caseTeamOperationsRepository,
      caseChecklistItemsRepository,
      checklistTemplatesRepository,
      checklistTemplateItemsRepository,
    },
    clearCalls,
  }
}

describe('CaseManagementSeeder', () => {
  it('clears only owned records in reverse dependency order', async () => {
    const { seeder, repositories, clearCalls } = createSeeder()

    await seeder.clear()

    expect(clearCalls).toEqual([
      'team-histories',
      'team-operations',
      'checklist-items',
      'case-members',
      'legal-cases',
    ])
    expect(repositories.caseTeamHistoriesRepository.removeAll).toHaveBeenCalledOnce()
    expect(repositories.caseTeamOperationsRepository.removeAll).toHaveBeenCalledOnce()
    expect(repositories.caseChecklistItemsRepository.removeAll).toHaveBeenCalledOnce()
    expect(repositories.caseMembersRepository.removeAll).toHaveBeenCalledOnce()
    expect(repositories.legalCasesRepository.removeAll).toHaveBeenCalledOnce()
    expect(repositories.checklistTemplatesRepository).not.toHaveProperty('removeAll')
  })

  it('requires seed references before inserting records', async () => {
    const { seeder, repositories } = createSeeder()

    await expect(seeder.run()).rejects.toThrow(
      'Case management seed references are required',
    )
    expect(repositories.checklistTemplatesRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    ['a lawyer', { lawyerIds: [] }],
    ['a contracted intake', { contractedIntakes: [] }],
  ])('requires %s before seeding', async (_requirement, overrides) => {
    const { seeder, repositories } = createSeeder()

    await expect(seeder.run(createReferences(overrides))).rejects.toThrow(
      'Case management seed requirements are not met',
    )
    expect(repositories.checklistTemplatesRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    ['legal area', { legalAreaId: undefined, legalTopicId: 'topic-1' }],
    ['legal topic', { legalAreaId: 'area-1', legalTopicId: undefined }],
  ])('rejects a contracted intake without its %s reference', async (_reference, overrides) => {
    const { seeder, repositories } = createSeeder()

    await expect(
      seeder.run(createReferences({ contractedIntakes: [createIntake(overrides)] })),
    ).rejects.toThrow('Contracted intake legal references are required to seed a case')
    expect(repositories.legalCasesRepository.addMany).not.toHaveBeenCalled()
  })

  it('seeds up to eight cases, checklist rows, titles, public codes, and team roles', async () => {
    const { seeder, repositories } = createSeeder()
    const intakes = Array.from({ length: 9 }, (_, index) =>
      createIntake({
        id: `intake-${index + 1}`,
        clientId: `client-${index + 1}`,
        demandNotes:
          index === 0
            ? 'Cliente solicita análise de aposentadoria por tempo de contribuição.'
            : undefined,
      }),
    )

    const result = await seeder.run(
      createReferences({
        contractedIntakes: intakes,
        lawyerIds: ['lawyer-1', 'lawyer-2'],
        paralegalIds: ['paralegal-1', 'paralegal-2'],
        supervisorIds: ['supervisor-1'],
      }),
    )

    const caseSeeds = repositories.legalCasesRepository.addMany.mock.calls[0]?.[0]
    const memberSeeds = repositories.caseMembersRepository.addMany.mock.calls[0]?.[0]
    const checklistSeeds =
      repositories.caseChecklistItemsRepository.addMany.mock.calls[0]?.[0]
    expect(caseSeeds).toHaveLength(8)
    expect(caseSeeds?.map(({ title }) => title)).toEqual([
      'Aposentadoria por tempo de contribuição',
      'Divorcio consensual',
      'Verbas rescisorias',
      'Cobranca indevida',
      'Planejamento sucessorio',
      'Revisao contratual',
      'Divorcio consensual',
      'Verbas rescisorias',
    ])
    expect(caseSeeds?.[0]?.publicCode).toMatch(/^CASO-\d{8}-0001$/)
    expect(caseSeeds?.[7]?.publicCode).toMatch(/^CASO-\d{8}-0008$/)
    expect(checklistSeeds).toHaveLength(24)
    expect(memberSeeds).toHaveLength(32)
    expect(memberSeeds?.slice(0, 4)).toMatchObject([
      { collaboratorId: 'lawyer-1', role: 'manager', assignedBy: 'actor-1' },
      { collaboratorId: 'lawyer-2', role: 'collaborator', assignedBy: 'actor-1' },
      { collaboratorId: 'paralegal-1', role: 'collaborator', assignedBy: 'actor-1' },
      { collaboratorId: 'supervisor-1', role: 'collaborator', assignedBy: 'actor-1' },
    ])
    expect(memberSeeds?.slice(4, 8)).toMatchObject([
      { collaboratorId: 'lawyer-1', role: 'manager' },
      { collaboratorId: 'lawyer-2', role: 'collaborator' },
      { collaboratorId: 'paralegal-2', role: 'collaborator' },
      { collaboratorId: 'supervisor-1', role: 'collaborator' },
    ])
    expect(result.legalCases).toHaveLength(8)
    expect(result.checklistTemplateItems).toHaveLength(3)
  })

  it('seeds a single manager when optional collaborator lists are empty', async () => {
    const { seeder, repositories } = createSeeder()

    await seeder.run(createReferences())

    expect(repositories.caseMembersRepository.addMany.mock.calls[0]?.[0]).toMatchObject([
      { collaboratorId: 'lawyer-1', role: 'manager', archivedLegacy: false },
    ])
  })

  it('uses the intake demand to title a retirement case regardless of letter case', async () => {
    const { seeder, repositories } = createSeeder()

    await seeder.run(
      createReferences({
        contractedIntakes: [
          createIntake({
            demandNotes: 'Pedido de APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO.',
          }),
        ],
      }),
    )

    expect(repositories.legalCasesRepository.addMany.mock.calls[0]?.[0][0]?.title).toBe(
      'Aposentadoria por tempo de contribuição',
    )
  })
})
