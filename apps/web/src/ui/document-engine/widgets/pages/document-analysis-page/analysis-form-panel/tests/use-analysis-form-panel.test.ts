import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAnalysisFormPanel } from '../use-analysis-form-panel'

describe('useAnalysisFormPanel', () => {
  it('sets the original document and delegates opening it', () => {
    const setValue = vi.fn()
    const onOpenDocument = vi.fn()

    const { result } = renderHook(() =>
      useAnalysisFormPanel({
        form: { setValue } as never,
        currentDecision: 'duplicate',
        document: { status: 'awaiting_validation' } as never,
        onOpenDocument,
      }),
    )

    act(() => {
      result.current.handleOpenDuplicateDocument('original-file-1')
    })

    expect(setValue).toHaveBeenCalledWith('originalDocumentId', 'original-file-1', {
      shouldDirty: true,
      shouldValidate: true,
    })
    expect(onOpenDocument).toHaveBeenCalledWith('original-file-1')
  })

  it('blocks duplicate confirmation when it was already reviewed', () => {
    const { result } = renderHook(() =>
      useAnalysisFormPanel({
        form: { setValue: vi.fn() } as never,
        currentDecision: 'duplicate',
        document: {
          status: 'duplicate',
          reviewedBy: 'reviewer-id-1',
          reviewedByName: 'Atendente HMS',
          reviewedAt: new Date('2026-09-10T12:00:00.000Z'),
        } as never,
        onOpenDocument: vi.fn(),
      }),
    )

    expect(result.current.isDuplicateAlreadyConfirmed).toBe(true)
    expect(result.current.savedDecisionNotice?.title).toBe(
      'Duplicidade já confirmada',
    )
    expect(result.current.savedDecisionNotice?.description).toContain(
      'Registrado por Atendente HMS',
    )
    expect(result.current.savedDecisionNotice?.description).not.toContain(
      'reviewer-id-1',
    )
  })

  it('keeps saved not linked decisions editable', () => {
    const { result } = renderHook(() =>
      useAnalysisFormPanel({
        form: { setValue: vi.fn() } as never,
        currentDecision: 'not_linked',
        document: {
          status: 'not_linked',
          reviewedByName: 'Advogado de desenvolvimento',
          reviewedAt: new Date('2026-09-10T12:00:00.000Z'),
        } as never,
        onOpenDocument: vi.fn(),
      }),
    )

    expect(result.current.isDuplicateAlreadyConfirmed).toBe(false)
    expect(result.current.savedDecisionNotice?.title).toBe(
      'Decisão salva: não vinculado',
    )
    expect(result.current.savedDecisionNotice?.description).toContain(
      'Registrado por Advogado de desenvolvimento',
    )
  })
})
