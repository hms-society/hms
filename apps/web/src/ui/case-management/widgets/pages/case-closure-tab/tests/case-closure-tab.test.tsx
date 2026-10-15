import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CaseClosureTab } from '..'
import { useCaseClosureTab } from '../use-case-closure-tab'

vi.mock('../use-case-closure-tab', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../use-case-closure-tab')>()),
  useCaseClosureTab: vi.fn(),
}))

const useCaseClosureTabMock = vi.mocked(useCaseClosureTab)

describe('CaseClosureTab', () => {
  beforeEach(() => {
    useCaseClosureTabMock.mockReturnValue({
      canConclude: false,
      canManage: true,
      completedSteps: 1,
      isConcluded: false,
      isFinancialSettlementPending: false,
      isReadOnly: false,
      isSettlementComplete: false,
      isArchiveComplete: false,
      isNewDemandCreated: false,
      outcome: 'Acordo homologado',
      outcomeSummary: 'Resumo demonstrativo',
      handleArchiveDocuments: vi.fn(),
      handleConfirmSettlement: vi.fn(),
      handleConclude: vi.fn(),
      handleCreateNewDemand: vi.fn(),
      handleMarkNoSettlement: vi.fn(),
      handleOpenOutcomeEditor: vi.fn(),
      handleStartSettlement: vi.fn(),
      handleSaveOutcome: vi.fn(),
      setOutcome: vi.fn(),
      setOutcomeSummary: vi.fn(),
      isOutcomeEditorOpen: false,
      setOutcomeEditorOpen: vi.fn(),
    })
  })

  it('renders the outcome, milestones, closure checklist, and disabled conclusion action', () => {
    render(<CaseClosureTab canManage />)

    expect(screen.getByRole('heading', { name: 'Acordo homologado' })).toBeDefined()
    expect(screen.getByText('Marcos de encerramento')).toBeDefined()
    expect(screen.getByText('Checklist de conclusão')).toBeDefined()
    expect(screen.getByText('Comunicação final ao cliente')).toBeDefined()
    expect(screen.getByText('Acerto e repasse ao cliente')).toBeDefined()
    expect(screen.getByText('Arquivamento dos documentos')).toBeDefined()
    expect(
      (screen.getByRole('button', { name: 'Concluir encerramento' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
