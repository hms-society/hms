import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'

import { ChecklistItemDetailPage } from '..'
import type { ChecklistItemDetailHeaderProps } from '../components/detail-header'
import type { ChecklistItemHistoryPanelProps } from '../components/history-panel'
import type { ChecklistItemMainPanelProps } from '../components/main-panel'
import type { ChecklistItemSidePanelProps } from '../components/side-panel'
import { useChecklistItemDetailPage } from '../use-checklist-item-detail-page'

vi.mock('../use-checklist-item-detail-page', () => ({
  useChecklistItemDetailPage: vi.fn(),
}))

vi.mock('../components/detail-header', () => ({
  ChecklistItemDetailHeader: ({ checklistItem }: ChecklistItemDetailHeaderProps) => (
    <div data-testid='checklist-item-detail-header'>{checklistItem.title}</div>
  ),
}))

vi.mock('../components/main-panel', () => ({
  ChecklistItemMainPanel: ({ itemView }: ChecklistItemMainPanelProps) => (
    <div data-testid='checklist-item-main-panel'>{itemView.pendingItems.length}</div>
  ),
}))

vi.mock('../components/history-panel', () => ({
  ChecklistItemHistoryPanel: ({ itemView }: ChecklistItemHistoryPanelProps) => (
    <div data-testid='checklist-item-history-panel'>{itemView.historyEvents.length}</div>
  ),
}))

vi.mock('../components/side-panel', () => ({
  ChecklistItemSidePanel: ({ itemView }: ChecklistItemSidePanelProps) => (
    <div data-testid='checklist-item-side-panel'>{itemView.statusLabel}</div>
  ),
}))

const useChecklistItemDetailPageMock = vi.mocked(useChecklistItemDetailPage)

describe('ChecklistItemDetailPage', () => {
  beforeEach(() => {
    useChecklistItemDetailPageMock.mockReturnValue(createController())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('composes the real checklist item detail sections', () => {
    render(<ChecklistItemDetailPage caseId='case-1' checklistItemId='checklist-item-1' />)

    expect(screen.getByTestId('checklist-item-detail-header').textContent).toContain(
      'Documento teste 1',
    )
    expect(screen.getByTestId('checklist-item-side-panel').textContent).toContain(
      'Aguardando validação',
    )
  })
})

function createController(
  overrides: Partial<ReturnType<typeof useChecklistItemDetailPage>> = {},
): ReturnType<typeof useChecklistItemDetailPage> {
  const checklistItem: CaseChecklistItem = {
    caseId: 'case-1',
    createdAt: new Date('2026-08-29T12:00:00.000Z'),
    documentFileId: 'document-file-1',
    documentFileName: 'pdf_teste_2_paginas.pdf',
    id: 'checklist-item-1',
    isRequired: true,
    status: 'pending',
    templateItemKey: 'documento-teste-1',
    title: 'Documento teste 1',
    updatedAt: new Date('2026-08-29T12:00:00.000Z'),
  }

  return {
    checklistItem,
    document: undefined,
    documentFileId: 'document-file-1',
    error: null,
    isLoading: false,
    itemView: {
      auditMetrics: [],
      caseLabel: 'Caso case-1',
      documentLabel: 'pdf_teste_2_paginas.pdf',
      extractedFields: [],
      hasDocument: true,
      historyEvents: [],
      itemPositionLabel: '1 de 5',
      pendingItems: [],
      statusLabel: 'Aguardando validação',
      statusVariant: 'attention',
    },
    handleBackToCase: vi.fn(),
    handleOpenValidationDesk: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useChecklistItemDetailPage>
}
