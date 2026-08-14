import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentAnalysisPage } from '..'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({
    navigateTo: vi.fn(),
  }),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: PropsWithChildren) => (
    <a href='/caixa-de-documentos'>{children}</a>
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

function renderDocumentAnalysisPage(fileId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentAnalysisPage fileId={fileId} />
    </QueryClientProvider>,
  )
}

describe('DocumentAnalysisPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the not linked template for documents without a safe case match', () => {
    renderDocumentAnalysisPage('1')

    expect(screen.getAllByText('Não vinculado').length).toBeGreaterThan(0)
    expect(screen.getByText(/Sem sugestão segura de caso/)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Salvar decisão' })).toBeDefined()
  })

  it('renders the valid template with checklist and extracted fields', () => {
    renderDocumentAnalysisPage('2')

    expect(screen.getAllByText('Válido').length).toBeGreaterThan(0)
    expect(screen.getByText('Caso 0089')).toBeDefined()
    expect(screen.getByText('Data de emissão')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Confirmar validação' })).toBeDefined()
  })

  it('renders the illegible template with resend and save actions', () => {
    renderDocumentAnalysisPage('3')

    expect(screen.getAllByText('Ilegível').length).toBeGreaterThan(0)
    expect(screen.getByText('Vínculo indisponível')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Solicitar reenvio' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Salvar decisão' })).toBeDefined()
  })

  it('renders the processing failure template with resend guidance', () => {
    renderDocumentAnalysisPage('6')

    expect(screen.getByText('Motivo da falha')).toBeDefined()
    expect(screen.getByText('Arquivo protegido por senha')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Solicitar reenvio' })).toBeDefined()
  })

  it('renders resend requested as a read-only incomplete decision', () => {
    renderDocumentAnalysisPage('7')

    expect(screen.getAllByText('Reenvio solicitado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Somente leitura')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Salvar decisão' })).toBeNull()
  })
})
