import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalArea, LegalTopic } from '../../domain/entities'
import {
  LegalAreaAlreadyExistsError,
  LegalAreaNotFoundError,
  LegalTopicAlreadyExistsError,
  LegalTopicNotFoundError,
} from '../../domain/errors'
import type { LegalAreasRepository, LegalTopicsRepository } from '../../interfaces'
import {
  CreateLegalAreaUseCase,
  CreateLegalTopicUseCase,
  ListAdminLegalAreasUseCase,
  UpdateLegalAreaUseCase,
  UpdateLegalTopicUseCase,
} from '../index'

describe('Legal Catalog Admin Use Cases', () => {
  let legalAreasRepository: MockProxy<LegalAreasRepository>
  let legalTopicsRepository: MockProxy<LegalTopicsRepository>

  beforeEach(() => {
    legalAreasRepository = mock<LegalAreasRepository>()
    legalTopicsRepository = mock<LegalTopicsRepository>()
  })

  it('creates a trimmed legal area when the name is available', async () => {
    const legalArea = makeLegalArea({ name: 'Trabalhista' })
    legalAreasRepository.findByName.mockResolvedValue(undefined)
    legalAreasRepository.addMany.mockResolvedValue([legalArea])

    const result = await new CreateLegalAreaUseCase(legalAreasRepository).execute({
      name: ' Trabalhista ',
      active: true,
    })

    expect(legalAreasRepository.findByName).toHaveBeenCalledWith(' Trabalhista ')
    expect(legalAreasRepository.addMany).toHaveBeenCalledWith([
      { name: 'Trabalhista', active: true },
    ])
    expect(result).toEqual(legalArea)
  })

  it('rejects a duplicated legal area name', async () => {
    legalAreasRepository.findByName.mockResolvedValue(makeLegalArea())

    await expect(
      new CreateLegalAreaUseCase(legalAreasRepository).execute({
        name: 'Cível',
        active: true,
      }),
    ).rejects.toBeInstanceOf(LegalAreaAlreadyExistsError)

    expect(legalAreasRepository.addMany).not.toHaveBeenCalled()
  })

  it('lists admin legal areas with all active and inactive topics', async () => {
    const civilArea = makeLegalArea({ id: 'area-civil', name: 'Cível' })
    const laborArea = makeLegalArea({ id: 'area-labor', name: 'Trabalhista' })
    const contractTopic = makeLegalTopic({
      id: 'topic-contracts',
      legalAreaId: civilArea.id,
      name: 'Contratos',
    })
    const inactiveTopic = makeLegalTopic({
      id: 'topic-benefits',
      legalAreaId: laborArea.id,
      name: 'Benefícios',
      active: false,
    })
    legalAreasRepository.findAll.mockResolvedValue([civilArea, laborArea])
    legalTopicsRepository.findAllByLegalAreaId.mockImplementation(async (legalAreaId) =>
      legalAreaId === civilArea.id ? [contractTopic] : [inactiveTopic],
    )

    const result = await new ListAdminLegalAreasUseCase(
      legalAreasRepository,
      legalTopicsRepository,
    ).execute()

    expect(result).toEqual([
      { ...civilArea, topics: [contractTopic] },
      { ...laborArea, topics: [inactiveTopic] },
    ])
    expect(legalTopicsRepository.findAllByLegalAreaId).toHaveBeenCalledWith(civilArea.id)
    expect(legalTopicsRepository.findAllByLegalAreaId).toHaveBeenCalledWith(laborArea.id)
  })

  it('updates a legal area without checking duplicates when the normalized name is unchanged', async () => {
    const legalArea = makeLegalArea({ id: 'area-civil', name: 'Cível' })
    const updatedArea = { ...legalArea, name: 'Cível', active: false }
    legalAreasRepository.findById.mockResolvedValue(legalArea)
    legalAreasRepository.replace.mockResolvedValue(updatedArea)

    const result = await new UpdateLegalAreaUseCase(legalAreasRepository).execute({
      legalAreaId: legalArea.id,
      name: ' cível ',
      active: false,
    })

    expect(legalAreasRepository.findByName).not.toHaveBeenCalled()
    expect(legalAreasRepository.replace).toHaveBeenCalledWith(legalArea.id, {
      name: 'cível',
      active: false,
    })
    expect(result).toEqual(updatedArea)
  })

  it('rejects updates for missing legal areas', async () => {
    legalAreasRepository.findById.mockResolvedValue(undefined)

    await expect(
      new UpdateLegalAreaUseCase(legalAreasRepository).execute({
        legalAreaId: 'missing-area',
        active: false,
      }),
    ).rejects.toBeInstanceOf(LegalAreaNotFoundError)
  })

  it('creates a trimmed legal topic inside an existing area', async () => {
    const legalArea = makeLegalArea({ id: 'area-civil' })
    const legalTopic = makeLegalTopic({ legalAreaId: legalArea.id, name: 'Contratos' })
    legalAreasRepository.findById.mockResolvedValue(legalArea)
    legalTopicsRepository.findByLegalAreaIdAndName.mockResolvedValue(undefined)
    legalTopicsRepository.addMany.mockResolvedValue([legalTopic])

    const result = await new CreateLegalTopicUseCase(
      legalAreasRepository,
      legalTopicsRepository,
    ).execute({
      legalAreaId: legalArea.id,
      name: ' Contratos ',
      active: true,
    })

    expect(legalTopicsRepository.addMany).toHaveBeenCalledWith([
      { legalAreaId: legalArea.id, name: 'Contratos', active: true },
    ])
    expect(result).toEqual(legalTopic)
  })

  it('rejects a legal topic when its area does not exist', async () => {
    legalAreasRepository.findById.mockResolvedValue(undefined)

    await expect(
      new CreateLegalTopicUseCase(legalAreasRepository, legalTopicsRepository).execute({
        legalAreaId: 'missing-area',
        name: 'Contratos',
        active: true,
      }),
    ).rejects.toBeInstanceOf(LegalAreaNotFoundError)
  })

  it('rejects a duplicated topic inside the same legal area', async () => {
    const legalArea = makeLegalArea({ id: 'area-civil' })
    legalAreasRepository.findById.mockResolvedValue(legalArea)
    legalTopicsRepository.findByLegalAreaIdAndName.mockResolvedValue(makeLegalTopic())

    await expect(
      new CreateLegalTopicUseCase(legalAreasRepository, legalTopicsRepository).execute({
        legalAreaId: legalArea.id,
        name: 'Contratos',
        active: true,
      }),
    ).rejects.toBeInstanceOf(LegalTopicAlreadyExistsError)

    expect(legalTopicsRepository.addMany).not.toHaveBeenCalled()
  })

  it('updates a legal topic when the new name is available', async () => {
    const legalTopic = makeLegalTopic({ id: 'topic-contracts', name: 'Contratos' })
    const updatedTopic = { ...legalTopic, name: 'Revisão contratual', active: false }
    legalTopicsRepository.findById.mockResolvedValue(legalTopic)
    legalTopicsRepository.findByLegalAreaIdAndName.mockResolvedValue(undefined)
    legalTopicsRepository.replace.mockResolvedValue(updatedTopic)

    const result = await new UpdateLegalTopicUseCase(legalTopicsRepository).execute({
      legalTopicId: legalTopic.id,
      name: ' Revisão contratual ',
      active: false,
    })

    expect(legalTopicsRepository.findByLegalAreaIdAndName).toHaveBeenCalledWith(
      legalTopic.legalAreaId,
      'Revisão contratual',
    )
    expect(legalTopicsRepository.replace).toHaveBeenCalledWith(legalTopic.id, {
      name: 'Revisão contratual',
      active: false,
    })
    expect(result).toEqual(updatedTopic)
  })

  it('rejects updates for missing legal topics', async () => {
    legalTopicsRepository.findById.mockResolvedValue(undefined)

    await expect(
      new UpdateLegalTopicUseCase(legalTopicsRepository).execute({
        legalTopicId: 'missing-topic',
        active: false,
      }),
    ).rejects.toBeInstanceOf(LegalTopicNotFoundError)
  })
})

function makeLegalArea(overrides: Partial<LegalArea> = {}): LegalArea {
  return {
    id: overrides.id ?? 'area-civil',
    name: overrides.name ?? 'Cível',
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? new Date('2026-09-10T12:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-09-10T12:00:00.000Z'),
  }
}

function makeLegalTopic(overrides: Partial<LegalTopic> = {}): LegalTopic {
  return {
    id: overrides.id ?? 'topic-contracts',
    legalAreaId: overrides.legalAreaId ?? 'area-civil',
    name: overrides.name ?? 'Contratos',
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? new Date('2026-09-10T12:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-09-10T12:00:00.000Z'),
  }
}
