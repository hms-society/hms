import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCaseChecklist } from '../hooks/use-case-checklist'

const mocks = vi.hoisted(() => ({ checklist: vi.fn(), documents: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    caseManagementService: { listCaseChecklist: mocks.checklist },
    documentValidationService: { listDocuments: mocks.documents },
  }),
}))
vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: () => ({
    currentCollaborator: { collaboratorId: 'actor-1' },
  }),
}))
afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.checklist.mockResolvedValue({ isFailure: false, body: [] })
  mocks.documents.mockResolvedValue({ isFailure: false, body: [] })
})

for (const source of ['checklist', 'documents'] as const) {
  describe(`useCaseChecklist denied ${source}`, () => {
    it('purges protected rows and preserves an observable error without retrying', async () => {
      const error = new Error('Forbidden')
      mocks[source].mockResolvedValue({
        isFailure: true,
        statusCode: 403,
        throwError: () => {
          throw error
        },
      })
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const queryKey =
        source === 'checklist'
          ? ['case-management', 'cases', 'case-1', 'checklist', 'actor-1']
          : ['document-validation', 'documents', { caseId: 'case-1', actorId: 'actor-1' }]
      client.setQueryData(queryKey, [{ id: 'protected-row' }])
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client }, children)
      const { result } = renderHook(() => useCaseChecklist({ caseId: 'case-1' }), {
        wrapper,
      })
      await waitFor(() => expect(result.current.checklistError).toBe(error))
      expect(client.getQueryData(queryKey)).toEqual([])
      expect(mocks[source]).toHaveBeenCalledOnce()
      expect(result.current.checklistItems).toEqual([])
      client.clear()
    })
  })
}
