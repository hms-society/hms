import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDayEventsDialog } from '../use-day-events-dialog'

describe('useDayEventsDialog', () => {
  it('exposes trigger capture for focus restoration', () => {
    const { result } = renderHook(() => useDayEventsDialog(true))
    expect(result.current.captureTrigger).toBeDefined()
  })
})
