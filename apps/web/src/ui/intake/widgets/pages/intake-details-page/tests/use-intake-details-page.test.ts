import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useStartFormalizationAction } from '@/ui/formalization/hooks/use-start-formalization-action'
import { useCloseIntakeWithoutContractAction } from '@/ui/intake/hooks/use-close-intake-without-contract-action'
import { useIntakeDetailsQuery } from '@/ui/intake/hooks/use-intake-details-query'

import { useIntakeDetailsPage } from '../use-intake-details-page'

vi.mock('@/ui/formalization/hooks/use-start-formalization-action', () => ({
  useStartFormalizationAction: vi.fn(),
}))
vi.mock('@/ui/intake/hooks/use-close-intake-without-contract-action', () => ({
  useCloseIntakeWithoutContractAction: vi.fn(),
}))
vi.mock('@/ui/intake/hooks/use-intake-details-query', () => ({
  useIntakeDetailsQuery: vi.fn(),
}))

const query = vi.mocked(useIntakeDetailsQuery)
const start = vi.mocked(useStartFormalizationAction)
const close = vi.mocked(useCloseIntakeWithoutContractAction)

const intake = {
  id: 'intake-1',
  version: 4,
  status: 'contracted',
  responsibleId: 'responsible-1',
} as const

describe('useIntakeDetailsPage', () => {
  it('disables terminal controls while preserving optional outcome projections', () => {
    query.mockReturnValue({
      data: {
        intake,
        responsible: { professionalName: 'Ana' },
        legalCase: { caseId: 'case-1' },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    start.mockReturnValue({ mutate: vi.fn(), isPending: false, error: null } as never)
    close.mockReturnValue({
      closeIntakeError: null,
      isClosingIntake: false,
      closeIntakeWithoutContract: vi.fn(),
    } as never)

    const { result } = renderHook(() => useIntakeDetailsPage('intake-1'))

    expect(result.current.content?.canEdit).toBe(false)
    expect(result.current.content?.canClose).toBe(false)
    expect(result.current.content?.responsibleName).toBe('Ana')
    expect(result.current.content?.data.legalCase).toEqual({ caseId: 'case-1' })
  })

  it('normalizes closure notes and supplies the current Intake version', async () => {
    const closeIntakeWithoutContract = vi.fn().mockResolvedValue(undefined)
    query.mockReturnValue({
      data: { intake: { ...intake, status: 'in_formalization' }, responsible: undefined },
      refetch: vi.fn(),
      isLoading: false,
      isError: false,
    } as never)
    start.mockReturnValue({ mutate: vi.fn(), isPending: false, error: null } as never)
    close.mockReturnValue({
      closeIntakeError: null,
      isClosingIntake: false,
      closeIntakeWithoutContract,
    } as never)

    const { result } = renderHook(() => useIntakeDetailsPage('intake-1'))
    act(() => result.current.content?.onClosureReasonChange('client_withdrew'))
    act(() => result.current.content?.onClosureNotesChange('  desistência  '))
    await act(async () => result.current.content?.onConfirmClosure())

    expect(closeIntakeWithoutContract).toHaveBeenCalledWith({
      closureNotes: 'desistência',
      closureReason: 'client_withdrew',
      expectedVersion: 4,
    })
  })
})
