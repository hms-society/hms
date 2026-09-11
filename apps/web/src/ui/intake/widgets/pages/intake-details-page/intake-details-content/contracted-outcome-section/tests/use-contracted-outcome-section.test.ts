import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useContractedOutcomeSection } from '../use-contracted-outcome-section'

describe('useContractedOutcomeSection', () => {
  it('keeps independent projections and retry callbacks mapped to the section', () => {
    const onRetryFormalization = vi.fn()
    const onRetryCase = vi.fn()
    const props = {
      intake: { sequenceNumber: 27 },
      formalization: undefined,
      legalCase: { caseId: 'case-1' },
      legalAreaName: undefined,
      primaryLawyerName: undefined,
      isFormalizationUnavailable: true,
      isCaseUnavailable: false,
      onRetryFormalization,
      onRetryCase,
    } as never

    const { result } = renderHook(() => useContractedOutcomeSection(props))

    expect(result.current.sectionLabel).toBe('Desfecho do Intake 27')
    expect(result.current.formalization).toBeUndefined()
    expect(result.current.legalCase).toEqual({ caseId: 'case-1' })
    result.current.onRetryFormalization()
    result.current.onRetryCase()
    expect(onRetryFormalization).toHaveBeenCalledOnce()
    expect(onRetryCase).toHaveBeenCalledOnce()
  })
})
