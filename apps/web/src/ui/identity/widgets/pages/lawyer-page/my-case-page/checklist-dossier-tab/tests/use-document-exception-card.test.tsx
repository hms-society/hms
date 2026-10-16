import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '@hms/core/document-engine/domain/structures'

import { useDocumentExceptionCard } from '../document-exception-card/use-document-exception-card'

type DocumentException = Parameters<typeof useDocumentExceptionCard>[0]

function createException(overrides: Partial<DocumentException> = {}): DocumentException {
  return {
    deadlineDate: undefined,
    id: 'exception-1',
    rejectionJustification: undefined,
    status: DocumentExceptionStatus.PENDING,
    type: DocumentExceptionType.ACEITE_PROVISORIO,
    ...overrides,
  } as DocumentException
}

describe('useDocumentExceptionCard', () => {
  afterEach(() => vi.useRealTimers())

  it.each([
    [DocumentExceptionStatus.APPROVED, 'Aprovado'],
    [DocumentExceptionStatus.EXPIRED, 'Pendente'],
    [DocumentExceptionStatus.PENDING, 'Pendente'],
    [DocumentExceptionStatus.REJECTED, 'Reprovado'],
  ] as const)('labels %s exceptions without deadlines', (status, label) => {
    const { result } = renderHook(() =>
      useDocumentExceptionCard(createException({ status }), vi.fn()),
    )

    expect(result.current.status).toMatchObject({
      className: 'text-muted-foreground bg-muted/20',
      label,
    })
  })

  it('distinguishes expired and future deadlines', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T12:00:00.000Z'))

    const expired = renderHook(() =>
      useDocumentExceptionCard(
        createException({ deadlineDate: new Date('2026-10-07T12:00:00.000Z') }),
        vi.fn(),
      ),
    )
    const future = renderHook(() =>
      useDocumentExceptionCard(
        createException({ deadlineDate: new Date('2026-10-09T12:00:00.000Z') }),
        vi.fn(),
      ),
    )

    expect(expired.result.current.status).toMatchObject({ label: 'Expirado' })
    expect(future.result.current.status.label).toContain('No prazo até 09/10/2026')
  })

  it('opens and keyboard-activates rejected justifications only when present', () => {
    const onViewJustification = vi.fn()
    const event = { key: 'Enter', preventDefault: vi.fn() }
    const spaceEvent = { key: ' ', preventDefault: vi.fn() }
    const { result } = renderHook(() =>
      useDocumentExceptionCard(
        createException({
          rejectionJustification: 'Documento ilegível.',
          status: DocumentExceptionStatus.REJECTED,
        }),
        onViewJustification,
      ),
    )

    act(() => result.current.handleOpenJustification())
    act(() => result.current.handleKeyDown(event as never))
    act(() => result.current.handleKeyDown(spaceEvent as never))

    expect(result.current.hasRejectionJustification).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(spaceEvent.preventDefault).toHaveBeenCalledOnce()
    expect(onViewJustification).toHaveBeenCalledTimes(3)
    expect(onViewJustification).toHaveBeenCalledWith('Documento ilegível.')
  })

  it('ignores other keys and non-rejected exceptions', () => {
    const onViewJustification = vi.fn()
    const event = { key: 'Escape', preventDefault: vi.fn() }
    const { result } = renderHook(() =>
      useDocumentExceptionCard(
        createException({
          rejectionJustification: 'Motivo',
          status: DocumentExceptionStatus.PENDING,
        }),
        onViewJustification,
      ),
    )

    act(() => result.current.handleOpenJustification())
    act(() => result.current.handleKeyDown(event as never))

    expect(result.current.hasRejectionJustification).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(onViewJustification).not.toHaveBeenCalled()
  })
})
