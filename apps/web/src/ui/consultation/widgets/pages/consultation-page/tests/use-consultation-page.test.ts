import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useLocation } from '@tanstack/react-router'
import { useConsultationPage } from '../use-consultation-page'

vi.mock('@tanstack/react-router', () => ({ useLocation: vi.fn() }))

const useLocationMock = vi.mocked(useLocation)

describe('useConsultationPage', () => {
  afterEach(() => vi.clearAllMocks())

  it('selects the package tab for a consultation document path', () => {
    useLocationMock.mockReturnValue({
      pathname: '/consultas/consultation-1/documentos',
    } as ReturnType<typeof useLocation>)

    const { result } = renderHook(() => useConsultationPage())

    expect(result.current.activeTab).toBe('package')
  })

  it('selects the attendance form tab for its route', () => {
    useLocationMock.mockReturnValue({
      pathname: '/consultas/consultation-1/ficha-atendimento',
    } as ReturnType<typeof useLocation>)

    const { result } = renderHook(() => useConsultationPage())

    expect(result.current.activeTab).toBe('form')
  })

  it('defaults to consultation details for other paths', () => {
    useLocationMock.mockReturnValue({
      pathname: '/consultas/consultation-1',
    } as ReturnType<typeof useLocation>)

    const { result } = renderHook(() => useConsultationPage())

    expect(result.current.activeTab).toBe('details')
  })
})
