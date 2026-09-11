import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormalizationPage } from '..'
import { useFormalizationPage } from '../use-formalization-page'

vi.mock('../use-formalization-page', () => ({ useFormalizationPage: vi.fn() }))
vi.mock('../commercial-conditions-card', () => ({
  CommercialConditionsCard: () => <div>conditions</div>,
}))
vi.mock('../formalization-documents-section', () => ({
  FormalizationDocumentsSection: () => <div>documents</div>,
}))
vi.mock('../formalization-context-header', () => ({
  FormalizationContextHeader: () => <div>context</div>,
}))
vi.mock('../formalization-sending-configuration-summary', () => ({
  FormalizationSendingConfigurationSummary: () => <div>sending card</div>,
}))
vi.mock('../close-without-contract-action', () => ({
  CloseWithoutContractAction: () => null,
}))
vi.mock('../confirm-contracting-action', () => ({
  ConfirmContractingAction: (props: { status: unknown }) => (
    <div data-testid='contracting-action'>{props.status ? 'ready' : 'not ready'}</div>
  ),
}))
vi.mock('../formalization-state-panels', () => ({
  FormalizationLoadingPanel: () => <p>loading</p>,
  FormalizationStatePanel: ({ title }: { title: string }) => <p>{title}</p>,
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: { children: React.ReactNode }) => (
    <a href='/intakes/intake-1'>{children}</a>
  ),
}))
vi.mock('@/ui/shared/widgets/dynamic-form/select-form', () => ({
  SelectFormDialog: () => null,
}))

const usePage = vi.mocked(useFormalizationPage)
const data = {
  intake: { id: 'intake-1', version: 12, legalAreaId: 'area-1', legalTopicId: 'topic-1' },
  formalization: {
    id: 'formalization-1',
    version: 8,
    status: 'in_progress',
    contractFormState: 'closed',
    contractFormSnapshot: { fields: [], name: 'Contrato' },
    contractFormAnswers: [],
    legalAreaId: 'area-1',
    legalTopicId: 'topic-1',
    contractFormId: 'form-1',
  },
} as never

function pageState(status: unknown = null) {
  return {
    query: { data, isLoading: false, isError: false, refetch: vi.fn() },
    actions: {
      saveDraft: { error: null, isPending: false, mutate: vi.fn() },
      closeForm: { error: null, isPending: false, mutate: vi.fn() },
      reopenForm: { error: null, isPending: false, mutate: vi.fn() },
      replaceForm: { error: null, isPending: false, mutate: vi.fn() },
    },
    effectiveAnswers: {},
    documentProduction: { isPackageConfirmed: true },
    signatureConfiguration: { configuration: undefined },
    signatureSending: {
      status,
      isLoadingReview: false,
      isLoadingStatus: false,
      isConfirmingContracting: false,
      confirmContractingError: null,
      confirmContracting: vi.fn(),
    },
    closeWithoutContract: {},
    isFormSelectionOpen: false,
    setIsFormSelectionOpen: vi.fn(),
    setAnswer: vi.fn(),
    replaceForm: vi.fn(),
  } as never
}

describe('FormalizationPage', () => {
  afterEach(cleanup)
  beforeEach(() => vi.clearAllMocks())

  it('places one contracting action outside the sending summary and removes the obsolete placeholder', () => {
    usePage.mockReturnValue(pageState({ canConfirmContracting: true }))
    render(<FormalizationPage formalizationId='formalization-1' />)

    expect(screen.getByText('sending card')).not.toBeNull()
    expect(screen.getByTestId('contracting-action')).not.toBeNull()
    expect(
      screen.queryByText(
        'A confirmação da contratação ficará disponível em uma etapa futura.',
      ),
    ).toBeNull()
  })

  it('keeps primary loading and failure surfaces page-owned', () => {
    usePage.mockReturnValue({ query: { isLoading: true } } as never)
    const { rerender } = render(<FormalizationPage formalizationId='formalization-1' />)
    expect(screen.getByText('loading')).not.toBeNull()

    usePage.mockReturnValue({
      query: { isLoading: false, isError: true, data: undefined },
    } as never)
    rerender(<FormalizationPage formalizationId='formalization-1' />)
    expect(screen.getByText('Não foi possível carregar a formalização')).not.toBeNull()
  })
})
