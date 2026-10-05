import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { usePortalDocumentsPage } from '../use-portal-documents-page'

const { caseManagementServiceMock } = vi.hoisted(() => ({
  caseManagementServiceMock: {
    listPortalPendingChecklist: vi.fn(),
  },
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

const pendingItem: CaseChecklistItem = {
  id: '00000000-0000-4000-8000-000000000001',
  caseId: '00000000-0000-4000-8000-000000000002',
  templateItemKey: 'identity-document',
  title: 'Documento de identidade',
  isRequired: true,
  status: 'pending',
  createdAt: new Date('2026-09-22T10:00:00.000Z'),
  updatedAt: new Date('2026-09-22T10:00:00.000Z'),
}

const inAnalysisItem: CaseChecklistItem = {
  ...pendingItem,
  id: '00000000-0000-4000-8000-000000000003',
  templateItemKey: 'proof-of-address',
  title: 'Comprovante de endereço',
  status: 'in_analysis',
}

const validatedItem: CaseChecklistItem = {
  ...pendingItem,
  id: '00000000-0000-4000-8000-000000000004',
  templateItemKey: 'income-proof',
  title: 'Comprovante de renda',
  status: 'validated',
}

describe('usePortalDocumentsPage', () => {
  let queryClient: QueryClient

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    useRestContextMock.mockReturnValue({
      caseManagementService: caseManagementServiceMock,
    } as unknown as ReturnType<typeof useRestContext>)
  })

  function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  it('loads and classifies checklist items by status', async () => {
    const checklist = [pendingItem, inAnalysisItem, validatedItem]
    caseManagementServiceMock.listPortalPendingChecklist.mockResolvedValue(
      new RestResponse({ body: checklist }),
    )

    const { result } = renderHook(
      () => usePortalDocumentsPage('case-1', 'portal-token'),
      { wrapper },
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isFetching).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.checklist).toEqual(checklist)
    expect(result.current.pendingItems).toEqual([pendingItem])
    expect(result.current.inAnalysisItems).toEqual([inAnalysisItem])
    expect(result.current.validatedItems).toEqual([validatedItem])
    expect(caseManagementServiceMock.listPortalPendingChecklist).toHaveBeenCalledWith(
      'case-1',
      'portal-token',
    )
  })

  it('starts with an empty checklist and skips the request when either parameter is empty', () => {
    const { result, rerender } = renderHook(
      ({ caseId, portalToken }) => usePortalDocumentsPage(caseId, portalToken),
      {
        initialProps: { caseId: '', portalToken: 'portal-token' },
        wrapper,
      },
    )

    expect(result.current.checklist).toEqual([])
    expect(result.current.pendingItems).toEqual([])
    expect(result.current.inAnalysisItems).toEqual([])
    expect(result.current.validatedItems).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
    expect(caseManagementServiceMock.listPortalPendingChecklist).not.toHaveBeenCalled()

    rerender({ caseId: 'case-1', portalToken: '' })

    expect(caseManagementServiceMock.listPortalPendingChecklist).not.toHaveBeenCalled()
  })

  it('exposes a request error and allows the checklist to be retried', async () => {
    caseManagementServiceMock.listPortalPendingChecklist
      .mockRejectedValueOnce(new Error('Checklist unavailable'))
      .mockResolvedValueOnce(new RestResponse({ body: [pendingItem] }))

    const { result } = renderHook(
      () => usePortalDocumentsPage('case-1', 'portal-token'),
      { wrapper },
    )

    await waitFor(() =>
      expect(result.current.error?.message).toBe('Checklist unavailable'),
    )
    expect(result.current.checklist).toEqual([])

    await result.current.refetch()

    await waitFor(() => expect(result.current.error).toBeNull())
    expect(result.current.checklist).toEqual([pendingItem])
    expect(result.current.pendingItems).toEqual([pendingItem])
    expect(caseManagementServiceMock.listPortalPendingChecklist).toHaveBeenCalledTimes(2)
  })

  it('surfaces a failed REST response as a query error', async () => {
    caseManagementServiceMock.listPortalPendingChecklist.mockResolvedValue(
      new RestResponse({ errorMessage: 'Portal expired', statusCode: 401 }),
    )

    const { result } = renderHook(
      () => usePortalDocumentsPage('case-1', 'portal-token'),
      { wrapper },
    )

    await waitFor(() => expect(result.current.error?.message).toBe('Portal expired'))
    expect(result.current.checklist).toEqual([])
    expect(result.current.pendingItems).toEqual([])
  })
})
