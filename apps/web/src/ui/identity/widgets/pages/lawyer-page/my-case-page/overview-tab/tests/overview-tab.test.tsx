import { CaseTaskFaker } from '@hms/core/case-management/domain/entities/fakers'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OverviewTab } from '../index'
import { useOverviewTab } from '../use-overview-tab'
import type { OverviewTabProps } from '../index'

vi.mock('../use-overview-tab', () => ({ useOverviewTab: vi.fn() }))

const useOverviewTabMock = vi.mocked(useOverviewTab)
const onOpenChecklistMock = vi.fn()
const priorityItem = {
  ...CaseTaskFaker.fake({ id: 'priority-task', title: 'Prazo prioritário' }),
  isOverdue: true,
  isAssignedToCurrentUser: true,
  typeLabel: 'Prazo jurídico',
  statusLabel: 'Em aberto',
  plannedDateLabel: '07/10/2026',
}
const documentPending = {
  id: 'pending-1',
  checklistItemId: 'item-1',
  title: 'Documento de identificação',
  reasonLabel: 'Documento ilegível',
  documentFileName: 'rg.pdf',
  messageStatusLabel: 'Mensagem aguardando aprovação',
  messagePreview: 'Envie uma nova cópia para análise.',
  createdAt: new Date('2026-10-08T12:00:00.000Z'),
}
const handleOpenChecklistItemMock = vi.fn()

const defaultProps: OverviewTabProps = {
  caseId: 'case-1',
  checklist: [],
  completionPercentage: 0,
  mandatoryItemsCount: 0,
  pendingItemsCount: 0,
  currentCollaboratorId: 'current-user',
  team: [],
  timeline: [],
  validatedItemsCount: 0,
  onOpenChecklist: onOpenChecklistMock,
}

describe('OverviewTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOverviewTabMock.mockReturnValue({
      documentPendings: [],
      documentPendingsError: null,
      isLoadingDocumentPendings: false,
      caseTasksError: null,
      isLoadingCaseTasks: false,
      priorityItems: [priorityItem],
      handleOpenChecklistItem: handleOpenChecklistItemMock,
    })
  })

  it('renders prioritized case tasks and deadlines supplied by its widget contract', () => {
    render(<OverviewTab {...defaultProps} />)

    expect(screen.getByText('Prazo prioritário').textContent).toBe('Prazo prioritário')
    expect(screen.getByText('Atrasado').textContent).toBe('Atrasado')
    expect(useOverviewTabMock).toHaveBeenCalledWith({
      caseId: 'case-1',
      currentCollaboratorId: 'current-user',
    })
  })

  it('shows an empty state instead of static mock tasks when there are no priorities', () => {
    useOverviewTabMock.mockReturnValue({
      documentPendings: [],
      documentPendingsError: null,
      isLoadingDocumentPendings: false,
      caseTasksError: null,
      isLoadingCaseTasks: false,
      priorityItems: [],
      handleOpenChecklistItem: handleOpenChecklistItemMock,
    })
    render(<OverviewTab {...defaultProps} />)

    expect(
      screen.getByText('Nenhuma tarefa ou prazo requer atenção neste momento.'),
    ).toBeTruthy()
    expect(
      screen.queryByText('Mensagem assistida de solicitação de documentos'),
    ).toBeNull()
  })

  it('shows document pendings and links to the existing checklist item detail', () => {
    useOverviewTabMock.mockReturnValue({
      documentPendings: [documentPending],
      documentPendingsError: null,
      isLoadingDocumentPendings: false,
      caseTasksError: null,
      isLoadingCaseTasks: false,
      priorityItems: [],
      handleOpenChecklistItem: handleOpenChecklistItemMock,
    })

    render(<OverviewTab {...defaultProps} />)

    expect(screen.getByText('Documento ilegível · rg.pdf').textContent).toBe(
      'Documento ilegível · rg.pdf',
    )
    expect(screen.getByText('Mensagem aguardando aprovação').textContent).toBe(
      'Mensagem aguardando aprovação',
    )
    expect(screen.getByText('Envie uma nova cópia para análise.').textContent).toBe(
      'Envie uma nova cópia para análise.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ver documento' }))
    expect(handleOpenChecklistItemMock).toHaveBeenCalledWith('item-1')
  })

  it('keeps checklist actions connected to their public callback', () => {
    render(<OverviewTab {...defaultProps} />)
    const [openChecklistButton] = screen.getAllByRole('button', {
      name: 'Abrir checklist completo',
    })
    expect(openChecklistButton).toBeDefined()
    if (openChecklistButton) fireEvent.click(openChecklistButton)

    expect(onOpenChecklistMock).toHaveBeenCalledOnce()
  })
})
