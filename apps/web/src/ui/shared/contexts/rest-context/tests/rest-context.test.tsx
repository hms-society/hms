import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppError } from '@hms/core/shared/domain/errors'

import { RestContext, RestContextProvider } from '../index'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const services = {
  intakeService: {},
  identityService: {},
  legalCatalogService: {},
}

vi.mock('../use-rest-context-provider', () => ({
  useRestContextProvider: () => services,
}))

describe('RestContext', () => {
  it('throws when the consumer is outside the provider', () => {
    expect(() =>
      renderHook(() => useRestContext(), {
        wrapper: ({ children }) => (
          <RestContext.Provider value={null}>{children}</RestContext.Provider>
        ),
      }),
    ).toThrow(AppError)
  })

  it('exposes Identity and preserves Intake inside the provider', () => {
    const { result } = renderHook(() => useRestContext(), {
      wrapper: ({ children }) => <RestContextProvider>{children}</RestContextProvider>,
    })

    expect(result.current).toEqual(services)
  })
})
