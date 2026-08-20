import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { CollaboratorSummaryFaker } from '../../domain/entities/fakers'
import type { CollaboratorSummary } from '../../domain/entities'
import type { CollaboratorsRepository } from '../../interfaces'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import { ListLawyersUseCase } from '../list-lawyers-use-case'

describe('List Lawyers Use Case', () => {
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>

  beforeEach(() => {
    collaboratorsRepository = mock<CollaboratorsRepository>()
  })

  it('lists active lawyers with the requested page and limit', async () => {
    const page: PaginationResponse<CollaboratorSummary> = {
      items: [CollaboratorSummaryFaker.legal()],
      page: 2,
      pageSize: 10,
      total: 11,
      totalPages: 2,
    }
    collaboratorsRepository.list.mockResolvedValue(page)
    const useCase = new ListLawyersUseCase(collaboratorsRepository)

    await expect(
      useCase.execute({
        query: { page: 2, limit: 10, search: 'Ana' },
      }),
    ).resolves.toBe(page)

    expect(collaboratorsRepository.list).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'Ana',
      profile: 'lawyer',
      status: 'active',
    })
  })
})
