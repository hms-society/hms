import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IntakeFormData } from '@hms/validation/intake'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { NewIntakePage } from '../index'
import { useNewIntake } from '../use-new-intake'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a {...props} href={ROUTES[route]}>
      {children}
    </a>
  ),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    intakeService: {},
    identityService: {},
    legalCatalogService: {
      listLegalAreas: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      listLegalTopics: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
    },
  }),
}))

vi.mock('../use-new-intake', () => ({
  useNewIntake: vi.fn(),
}))

const useNewIntakeMock = vi.mocked(useNewIntake)

const handleClosureDialogChange = vi.fn()
const handleConfirmClosure = vi.fn()
const handleNext = vi.fn()
const handlePrevious = vi.fn()
const handleRequestClosure = vi.fn()
const handleReset = vi.fn()
const handleSubmit = vi.fn()

type ControllerOverrides = Partial<ReturnType<typeof useNewIntake>>

let controllerOverrides: ControllerOverrides = {}

function useNewIntakeTestController(): ReturnType<typeof useNewIntake> {
  const form = useForm<IntakeFormData>({
    defaultValues: {
      origin: 'direct',
      contactChannel: 'whatsapp',
      legalAreaId: '',
      legalTopicId: '',
      urgency: 'normal',
      clientId: '',
      decision: 'schedule',
    },
  })

  return {
    currentStep: 1,
    closureReason: undefined,
    decision: 'schedule',
    error: null,
    form,
    isClosureDialogOpen: false,
    isSubmitting: false,
    stepContent: {
      title: 'Registrar demanda',
      description: 'Informe como o cliente chegou e o assunto do atendimento.',
    },
    handleClosureDialogChange,
    handleConfirmClosure,
    handleNext,
    handlePrevious,
    handleRequestClosure,
    handleReset,
    handleSubmit,
    ...controllerOverrides,
  }
}

function renderNewIntakePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <NewIntakePage />
    </QueryClientProvider>,
  )
}

describe('NewIntakePage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    controllerOverrides = {}
    useNewIntakeMock.mockImplementation(useNewIntakeTestController)
  })

  it('renders the demand step and delegates the next action', () => {
    renderNewIntakePage()

    expect(screen.getByRole('heading', { name: 'Registrar demanda' })).toBeTruthy()
    expect(screen.getByText('Etapa 1 de 3')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Intakes' }).getAttribute('href')).toBe(
      ROUTES.intakes,
    )
    expect(screen.getAllByRole('listitem')[0].getAttribute('aria-current')).toBe('step')

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(handleNext).toHaveBeenCalledOnce()
  })

  it('renders the client step and delegates backward navigation', () => {
    controllerOverrides = {
      currentStep: 2,
      stepContent: {
        title: 'Vincular cliente',
        description: 'Confirme quem está solicitando o atendimento.',
      },
    }

    renderNewIntakePage()

    expect(screen.getByRole('heading', { name: 'Vincular cliente' })).toBeTruthy()
    expect(screen.getByText('Nenhum cliente vinculado')).toBeTruthy()
    expect(
      screen.getByText(
        'Selecione um cliente existente ou cadastre um novo para continuar.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Identificar ou cadastrar cliente' }),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))

    expect(handlePrevious).toHaveBeenCalledOnce()
  })

  it('renders the scheduling actions and delegates submit and reset', () => {
    controllerOverrides = {
      currentStep: 3,
      stepContent: {
        title: 'Definir próximo passo',
        description: 'Agende a consulta ou encerre o intake com um motivo.',
      },
    }

    renderNewIntakePage()

    expect(screen.getByRole('heading', { name: 'Definir próximo passo' })).toBeTruthy()
    const submitButton = screen.getByRole('button', { name: 'Criar intake' })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(submitButton)

    expect(handleReset).toHaveBeenCalledOnce()
    expect(handleSubmit).toHaveBeenCalledOnce()
  })

  it('exposes the semantic loading state while registering an intake', () => {
    controllerOverrides = {
      currentStep: 3,
      isSubmitting: true,
      stepContent: {
        title: 'Definir próximo passo',
        description: 'Agende a consulta ou encerre o intake com um motivo.',
      },
    }

    renderNewIntakePage()

    expect(
      screen.getByRole('button', { name: 'Criando...' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('delegates a request to close the intake without a contract', () => {
    controllerOverrides = {
      currentStep: 3,
      decision: 'close',
      closureReason: 'client_withdrew',
      stepContent: { title: 'Novo intake', description: '' },
    }

    renderNewIntakePage()

    expect(screen.getByRole('link', { name: 'Voltar' })).toBeTruthy()
    const closeButtons = screen.getAllByRole('button', {
      name: 'Encerrar atendimento',
    })

    fireEvent.click(closeButtons[0])

    expect(handleRequestClosure).toHaveBeenCalledOnce()
  })

  it('renders a registration error', () => {
    controllerOverrides = {
      error: new Error('request failed'),
    }

    renderNewIntakePage()

    expect(screen.getByRole('alert').textContent).toBe(
      'Não foi possível registrar o intake. Tente novamente.',
    )
  })

  it('renders and confirms the closure dialog', () => {
    controllerOverrides = {
      currentStep: 3,
      decision: 'close',
      closureReason: 'client_withdrew',
      isClosureDialogOpen: true,
      stepContent: { title: 'Novo intake', description: '' },
    }

    renderNewIntakePage()

    expect(
      screen.getByRole('alertdialog', { name: 'Encerrar sem contratação?' }),
    ).toBeTruthy()
    expect(screen.getByText('Cliente desistiu')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^Encerrar sem contratação$/ }))

    expect(handleConfirmClosure).toHaveBeenCalledOnce()
  })
})
