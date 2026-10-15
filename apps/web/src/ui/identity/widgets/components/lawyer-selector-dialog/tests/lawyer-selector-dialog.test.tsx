import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LawyerSelectorDialog } from '..'
import { useLawyerSelectorDialog } from '../use-lawyer-selector-dialog'

vi.mock('../use-lawyer-selector-dialog', () => ({
  useLawyerSelectorDialog: vi.fn(),
}))

const useLawyerSelectorDialogMock = vi.mocked(useLawyerSelectorDialog)
const handleLawyerSelectMock = vi.fn()
const handleConfirmMock = vi.fn()

describe('LawyerSelectorDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useLawyerSelectorDialogMock.mockReturnValue({
      area: 'all',
      areas: [],
      filteredLawyers: [
        {
          value: 'lawyer-1',
          label: 'Dra. Ana Silva',
          area: 'Direito Civil',
          topics: ['Contratos'],
          initials: 'AS',
          avatarClassName: 'bg-primary/15 text-primary',
        },
      ],
      handleAreaChange: vi.fn(),
      handleClearFilters: vi.fn(),
      handleConfirm: handleConfirmMock,
      handleLawyerSelect: handleLawyerSelectMock,
      handleLoadMore: vi.fn(),
      handleSearchChange: vi.fn(),
      handleTopicChange: vi.fn(),
      handleRetry: vi.fn(),
      isError: false,
      isFetchingNextPage: false,
      isLoading: false,
      hasNextPage: false,
      search: '',
      selectedLawyerOption: {
        value: 'lawyer-1',
        label: 'Dra. Ana Silva',
        area: 'Direito Civil',
        topics: ['Contratos'],
        initials: 'AS',
        avatarClassName: 'bg-primary/15 text-primary',
      },
      topic: 'all',
      topics: [],
    } as never)
  })

  it('renders caller-provided dialog copy and delegates lawyer selection', () => {
    render(
      <LawyerSelectorDialog
        open
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        description='Filter the appointments by lawyer.'
      />,
    )

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('Filter the appointments by lawyer.').textContent).toBe(
      'Filter the appointments by lawyer.',
    )
    fireEvent.click(screen.getByRole('option', { name: /Dra\. Ana Silva/ }))
    expect(handleLawyerSelectMock).toHaveBeenCalledWith('lawyer-1')

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar advogado' }))
    expect(handleConfirmMock).toHaveBeenCalledOnce()
  })
})
