import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RestContext } from '@/ui/shared/contexts/rest-context'
import { NewPieceDialog } from '../new-piece-dialog'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: vi.fn() }),
}))

function renderDialogWithServices({
  getDocument = vi.fn(),
  generateDocument = vi.fn(),
  onOpenChange = () => {},
}: {
  getDocument?: ReturnType<typeof vi.fn>
  generateDocument?: ReturnType<typeof vi.fn>
  onOpenChange?: (open: boolean) => void
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const getGenerationContext = vi.fn().mockResolvedValue({
    isFailure: false,
    body: {
      case: { id: 'case-1', publicCode: 'CASO-001', title: 'Caso de teste' },
      models: [
        { id: 'model-1', name: 'Modelo Universal', description: 'Descrição' },
        { id: 'model-2', name: 'Recurso Administrativo INSS', description: 'Recurso' },
      ],
      documents: [
        'RG — Documento de Identidade',
        'CPF',
        'Comprovante de Residência',
        'CNIS — Cadastro Nacional de Informações Sociais',
      ].map((label, index) => ({
        id: `document-file-${index + 1}`,
        checklistItemId: `checklist-${index + 1}`,
        label,
        fileName: `documento-${index + 1}.pdf`,
        validationStatus: 'validated',
        reviewedAt: '2026-09-25T12:00:00.000Z',
        reviewedBy: 'Revisor',
      })),
      canGenerate: true,
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RestContext.Provider
        value={
          {
            caseDocumentProductionService: {
              getGenerationContext,
              generateDocument,
              getDocument,
            },
          } as never
        }
      >
        <NewPieceDialog
          open
          caseId='case-1'
          onOpenChange={onOpenChange}
          onGenerated={vi.fn()}
        />
      </RestContext.Provider>
    </QueryClientProvider>,
  )
}

async function startGeneration() {
  await screen.findByText('Modelo Universal')
  fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))
  fireEvent.click(
    await screen.findByRole('checkbox', {
      name: 'Selecionar RG — Documento de Identidade',
    }),
  )
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Observações para a IA (opcional)' }),
    {
      target: { value: 'Usar os fatos confirmados.' },
    },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Gerar minuta com IA' }))
  await screen.findByRole('heading', { name: 'Não foi possível confirmar a geração' })
}

describe('NewPieceDialog', () => {
  afterEach(cleanup)

  it('requires a reference document before starting generation', async () => {
    renderDialogWithServices()

    await screen.findByText('Modelo Universal')
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))
    expect(screen.getByRole('heading', { name: 'Preparar geração' })).toBeDefined()
    expect(
      (
        screen.getByRole('button', {
          name: 'Gerar minuta com IA',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar CPF' }))
    expect(
      (screen.getByRole('button', { name: 'Gerar minuta com IA' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })

  it('filters the model options by the search text', async () => {
    renderDialogWithServices()
    await screen.findByText('Modelo Universal')

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar modelo por nome' }), {
      target: { value: 'Modelo Universal' },
    })

    expect(screen.getByText('Modelo Universal')).toBeTruthy()
    expect(screen.queryByText('Recurso Administrativo INSS')).toBeNull()
  })

  it('preserves the filter when returning to model selection and closes on cancel', async () => {
    const onOpenChangeMock = vi.fn()
    renderDialogWithServices({ onOpenChange: onOpenChangeMock })
    await screen.findByText('Modelo Universal')

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar modelo por nome' }), {
      target: { value: 'Modelo Universal' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }))

    expect(
      (
        screen.getByRole('textbox', {
          name: 'Buscar modelo por nome',
        }) as HTMLInputElement
      ).value,
    ).toBe('Modelo Universal')
    expect(screen.queryByText('Recurso Administrativo INSS')).toBeNull()

    fireEvent.click(
      within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Cancelar' })[0],
    )
    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
  })

  it('shows the Figma preparation icons and allows manual document selection', async () => {
    renderDialogWithServices()
    await screen.findByText('Modelo Universal')

    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))

    const aiActionsHeading = screen.getByRole('heading', { name: 'O que a IA vai fazer' })
    expect(
      aiActionsHeading.parentElement?.querySelector('svg.lucide-sparkles'),
    ).not.toBeNull()
    expect(aiActionsHeading.parentElement?.querySelectorAll('ul > li svg')).toHaveLength(
      4,
    )
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(
      screen
        .getByRole('heading', { name: /Documentos de referência do dossiê/ })
        .closest('div')
        ?.querySelector('svg'),
    ).not.toBeNull()
    expect(screen.getByText('0 de 4 selecionados')).toBeDefined()

    const selectedCnis = screen.getByRole('checkbox', {
      name: 'Selecionar CNIS — Cadastro Nacional de Informações Sociais',
    })
    const unselectedRg = screen.getByRole('checkbox', {
      name: 'Selecionar RG — Documento de Identidade',
    })
    expect(selectedCnis.getAttribute('aria-checked')).toBe('false')
    expect(unselectedRg.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(unselectedRg)
    expect(screen.getByText('1 de 4 selecionados')).toBeDefined()
    expect(unselectedRg.getAttribute('aria-checked')).toBe('true')
  })

  it('leaves retry of a failed piece to its card in the pieces list', async () => {
    const generateDocument = vi.fn().mockResolvedValue({
      isFailure: false,
      body: { documentId: 'piece-1', documentGenerationId: 'generation-1' },
    })
    const getDocument = vi.fn().mockResolvedValue({
      isFailure: false,
      body: {
        id: 'piece-1',
        title: 'Peça de teste',
        versions: [],
        generation: { id: 'generation-1', status: 'failed' },
      },
    })

    renderDialogWithServices({ getDocument, generateDocument })
    await startGeneration()

    expect(screen.queryByRole('button', { name: 'Gerar novamente' })).toBeNull()
    expect(generateDocument).toHaveBeenCalledTimes(1)
  })

  it('does not offer retry before the server confirms a failed generation', async () => {
    const generateDocument = vi.fn().mockResolvedValue({
      isFailure: false,
      body: { documentId: 'piece-1', documentGenerationId: 'generation-1' },
    })
    const getDocument = vi.fn().mockResolvedValue({
      isFailure: false,
      body: {
        id: 'piece-1',
        title: 'Peça de teste',
        versions: [],
        generation: { id: 'generation-1', status: 'running' },
      },
    })

    renderDialogWithServices({ getDocument, generateDocument })
    await screen.findByText('Modelo Universal')
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Selecionar RG — Documento de Identidade',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gerar minuta com IA' }))
    await screen.findByText('A IA está preparando a minuta')

    expect(screen.queryByRole('button', { name: 'Gerar novamente' })).toBeNull()
    expect(generateDocument).toHaveBeenCalledTimes(1)
  })
})
