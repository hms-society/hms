import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChecklistItemDetailPage } from '..'
import { useChecklistItemDetailPage } from '../use-checklist-item-detail-page'

vi.mock('../use-checklist-item-detail-page', () => ({
  useChecklistItemDetailPage: vi.fn(),
}))

const useChecklistItemDetailPageMock = vi.mocked(useChecklistItemDetailPage)

describe('ChecklistItemDetailPage', () => {
  beforeEach(() => {
    useChecklistItemDetailPageMock.mockReturnValue({ handleBackToCase: vi.fn() })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the temporary checklist item context page', () => {
    const handleBackToCase = vi.fn()
    useChecklistItemDetailPageMock.mockReturnValue({ handleBackToCase })

    render(
      <ChecklistItemDetailPage
        caseId='case-1'
        checklistItemId='checklist-item-1'
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Detalhe do item do checklist' }),
    ).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /voltar ao caso/i }))

    expect(handleBackToCase).toHaveBeenCalledOnce()
  })
})
