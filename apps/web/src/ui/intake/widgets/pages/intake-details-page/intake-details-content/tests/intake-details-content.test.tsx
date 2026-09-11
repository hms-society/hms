import type { ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IntakeDetailsContent } from '..'

vi.mock('../contracted-outcome-section', () => ({
  ContractedOutcomeSection: () => (
    <section aria-label='contracted outcome'>Resultado da contratação</section>
  ),
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, ...props }: { children: ReactNode; route?: string }) => (
    <a href='/intakes' {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../intake-edit-dialog', () => ({ IntakeEditDialog: () => null }))
vi.mock('@/ui/intake/widgets/components/confirm-consultation-closure-dialog', () => ({
  ConfirmConsultationClosureDialog: () => null,
}))

const data = {
  intake: {
    id: 'intake-1',
    sequenceNumber: 12,
    clientId: 'client-1',
    responsibleId: 'responsible-1',
    createdBy: 'creator-1',
    updatedBy: 'updater-1',
    origin: 'direct',
    contactChannel: 'email',
    urgency: 'normal',
    status: 'contracted',
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-02'),
    version: 1,
  },
  client: {
    client: {
      id: 'client-1',
      type: 'natural',
      name: 'Cliente',
      taxId: { type: 'cpf', value: '123' },
      createdAt: new Date('2026-07-01'),
      updatedAt: new Date('2026-07-02'),
    },
    consents: [],
  },
  previousIntakes: [],
  formalizationCompletionUnavailable: false,
  legalCaseUnavailable: false,
} as const

const props = {
  data,
  isEditDialogOpen: false,
  isClosureDialogOpen: false,
  closureReason: '',
  closureNotes: '',
  canEdit: false,
  canClose: false,
  isClosing: false,
  isTransitioning: false,
  closeError: null,
  actionError: null,
  responsibleName: 'Atendente',
  onEditDialogOpenChange: vi.fn(),
  onClosureDialogOpenChange: vi.fn(),
  onClosureReasonChange: vi.fn(),
  onClosureNotesChange: vi.fn(),
  onConfirmClosure: vi.fn(),
  onStartFormalization: vi.fn(),
  onRetryFormalization: vi.fn(),
  onRetryCase: vi.fn(),
} as const

describe('IntakeDetailsContent', () => {
  afterEach(cleanup)

  it('renders the contracted outcome section and does not render terminal edit/close actions', () => {
    render(<IntakeDetailsContent {...props} />)

    expect(screen.getByRole('region', { name: 'contracted outcome' })).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Editar' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.queryByRole('button', { name: 'Encerrar sem contratação' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'INT-0012' })).not.toBeNull()
  })
})
