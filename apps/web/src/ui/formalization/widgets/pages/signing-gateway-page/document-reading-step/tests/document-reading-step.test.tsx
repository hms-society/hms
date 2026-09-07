import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentReadingStep } from '../index'
import { useDocumentReadingStep } from '../use-document-reading-step'

vi.mock('../use-document-reading-step', () => ({ useDocumentReadingStep: vi.fn() }))
vi.mock('../signing-document-viewer', () => ({
  SigningDocumentViewer: ({ title, error }: { title: string; error?: string }) => (
    <div data-testid='document-viewer' data-error={error}>
      {title}
    </div>
  ),
}))

const documents = [
  { id: 'document-1', title: 'Contrato', position: 0 },
  { id: 'document-2', title: 'Procuração', position: 1 },
]
const props = {
  documents,
  acknowledgedDocumentIds: [] as string[],
  activeDocumentId: 'document-1',
  isPending: false,
  onSelectDocument: vi.fn(),
  onAcknowledgeDocument: vi.fn(),
  onContinue: vi.fn(),
}

describe('DocumentReadingStep', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.mocked(useDocumentReadingStep).mockReturnValue({
      activeDocument: documents[0],
      actionError: undefined,
      acknowledged: false,
      allAcknowledged: false,
      content: new ArrayBuffer(1),
      documentError: undefined,
      isLoading: false,
      handleRetry: vi.fn(),
      handleAcknowledge: vi.fn(),
      handleContinue: vi.fn(),
    })
  })

  it('renders ordered document tabs and pending state', () => {
    render(<DocumentReadingStep {...props} />)
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      expect.stringContaining('Contrato'),
      expect.stringContaining('Procuração'),
    ])
    expect(screen.getAllByText('Documento pendente')).toHaveLength(2)
  })

  it('marks only the selected document tab as active', () => {
    render(<DocumentReadingStep {...props} />)
    expect(screen.getByRole('tab', { name: /Contrato/ }).getAttribute('data-state')).toBe(
      'active',
    )
    expect(
      screen.getByRole('tab', { name: /Procuração/ }).getAttribute('data-state'),
    ).toBe('inactive')
  })

  it('keeps package signing disabled until every document is acknowledged', () => {
    render(<DocumentReadingStep {...props} />)
    expect(
      screen.getByRole('button', { name: 'Assinar todos os documentos' }),
    ).toHaveProperty('disabled', true)
  })

  it('enables one package signing action after all acknowledgements', () => {
    vi.mocked(useDocumentReadingStep).mockReturnValue({
      ...vi.mocked(useDocumentReadingStep).getMockImplementation()?.(props),
      activeDocument: documents[0],
      actionError: undefined,
      acknowledged: true,
      allAcknowledged: true,
      content: new ArrayBuffer(1),
      documentError: undefined,
      isLoading: false,
      handleRetry: vi.fn(),
      handleAcknowledge: vi.fn(),
      handleContinue: vi.fn(),
    })
    render(
      <DocumentReadingStep
        {...props}
        acknowledgedDocumentIds={documents.map((d) => d.id)}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Assinar todos os documentos' }),
    ).toHaveProperty('disabled', false)
  })

  it('keeps the document viewer visible when acknowledgement fails', () => {
    vi.mocked(useDocumentReadingStep).mockReturnValue({
      activeDocument: documents[0],
      actionError: 'Não foi possível confirmar a leitura.',
      acknowledged: false,
      allAcknowledged: false,
      content: new ArrayBuffer(1),
      documentError: undefined,
      isLoading: false,
      handleRetry: vi.fn(),
      handleAcknowledge: vi.fn(),
      handleContinue: vi.fn(),
    })

    render(<DocumentReadingStep {...props} />)

    expect(screen.getByTestId('document-viewer').getAttribute('data-error')).toBeNull()
    expect(screen.getByRole('alert').textContent).toBe(
      'Não foi possível confirmar a leitura.',
    )
  })
})
