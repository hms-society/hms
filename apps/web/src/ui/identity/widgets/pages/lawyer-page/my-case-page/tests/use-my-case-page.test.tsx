import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LegalCaseFaker } from '@hms/core/case-management/domain/entities/fakers'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useCaseChecklist } from '../hooks/use-case-checklist'
import { useMyCasePage } from '../use-my-case-page'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))
vi.mock('../hooks/use-case-checklist', () => ({ useCaseChecklist: vi.fn() }))

const useRestContextMock = vi.mocked(useRestContext)
const useCaseChecklistMock = vi.mocked(useCaseChecklist)

describe('useMyCasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCaseChecklistMock.mockReturnValue({
      checklistItems: [],
      completionPercentage: 0,
      mandatoryItemsCount: 0,
      pendingItemsCount: 0,
      validatedItemsCount: 0,
    } as never)
  })

  it('shows checklist approval as production-ready without approving the dossier', async () => {
    const legalCase = LegalCaseFaker.fake({
      id: 'case-1',
      status: LegalCaseStatus.ReadyForLegalProduction,
      dossierGate: {},
    })
    useRestContextMock.mockReturnValue({
      caseManagementService: {
        getLegalCaseDetails: vi
          .fn()
          .mockResolvedValue(new RestResponse({ body: legalCase, statusCode: 200 })),
        listMyCases: vi
          .fn()
          .mockResolvedValue(new RestResponse({ body: [legalCase], statusCode: 200 })),
      },
    } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useMyCasePage({ caseId: 'case-1' }), {
      wrapper,
    })

    await waitFor(() =>
      expect(result.current.caseStatusLabel).toBe('Pronto para produção jurídica'),
    )

    expect(result.current.dossierApproved).toBe(false)
    expect(result.current.caseStages.find((stage) => stage.isActive)).toEqual(
      expect.objectContaining({
        label: 'Produção Jurídica',
        status: 'Aguardando homologação do dossiê',
      }),
    )
  })
})
