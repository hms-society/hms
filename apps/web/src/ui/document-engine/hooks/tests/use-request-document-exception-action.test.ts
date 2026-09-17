import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useRequestDocumentExceptionAction } from '../use-request-document-exception-action'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { toast } from 'sonner'
import React from 'react'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockRequestException = vi.fn()

const mockDocumentService = {
  requestException: mockRequestException,
}

const useRestContextMock = vi.mocked(useRestContext)

describe('Use Request Document Exception Action', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    useRestContextMock.mockReturnValue({
      documentService: mockDocumentService as any,
    } as any)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  )

  it('solicita uma exceção com sucesso e invalida os queries', async () => {
    mockRequestException.mockResolvedValue({
      isFailure: false,
      body: { id: 'exc-123' },
    })

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRequestDocumentExceptionAction('case-123'), {
      wrapper,
    })

    await act(async () => {
      await result.current.requestException({
        documentId: 'doc-456',
        type: 'ACEITE_PROVISORIO',
        justification: 'Falta assinar',
        deadlineDate: new Date('2026-10-10'),
      })
    })

    expect(mockRequestException).toHaveBeenCalledWith('case-123', {
      documentId: 'doc-456',
      type: 'ACEITE_PROVISORIO',
      justification: 'Falta assinar',
      deadlineDate: expect.any(Date),
    })

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['case-management', 'cases', 'case-123'],
    })
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['document-engine', 'case', 'case-123', 'document-exceptions'],
    })

    expect(toast.success).toHaveBeenCalledWith('Solicitação de exceção encaminhada com sucesso.')
  })

  it('exibe toast de erro quando a API falha', async () => {
    mockRequestException.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useRequestDocumentExceptionAction('case-123'), {
      wrapper,
    })

    await act(async () => {
      await result.current.requestException({
        documentId: 'doc-456',
        type: 'DISPENSA_DEFINITIVA',
        justification: 'Erro',
      }).catch(() => {})
    })

    expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro ao solicitar a exceção documental.')
  })
})
