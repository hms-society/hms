import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AttendanceForm } from '../attendance-form'
import { ConsultationPageActionProvider } from '../consultation-page-action-context'
import { ConsultationPagePrimaryAction } from '../consultation-page-primary-action'
import type { useConsultation } from '@/ui/consultation/hooks/use-consultation'

const handleCompleteConsultation = vi.fn().mockResolvedValue(undefined)
const handleFinalizeAttendance = vi.fn().mockResolvedValue(undefined)
const handleEditAttendance = vi.fn().mockResolvedValue(undefined)
const handleBack = vi.fn()
const listDynamicFormsMock = vi.hoisted(() => vi.fn())
const closeIntakeWithoutContractMock = vi.hoisted(() => vi.fn())

type ControllerOverrides = Partial<ReturnType<typeof useConsultation>>

let controllerOverrides: ControllerOverrides = {}

function useConsultationTestController(): ReturnType<typeof useConsultation> {
  return {
    isLoading: false,
    isError: false,
    error: null,
    isMarkingNoShow: false,
    isRescheduling: false,
    isCompleting: false,
    consultation: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      intakeId: '5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd',
      status: 'pending',
      modality: 'in_person',
      assignedLawyerId: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
      createdAt: '2026-08-06T20:10:31.107Z',
      notes: 'Notas prévias do advogado',
      primaryLegalQuestion: 'Questão jurídica principal válida',
      guidanceProvided: 'Orientação prestada ao cliente válida',
      viability: 'Viável',
      decision: 'Prosseguir para contratação',
      attendant: {
        name: 'Maria Atendente',
      },
      client: {
        id: 'a97f1adf-335c-4ea8-817b-09e7f8446b3d',
        name: 'Morris Lemke',
        taxIdValue: '03737829420',
        phone: '1-924-844-6535',
        email: 'Austen.Lebsack@yahoo.com',
        type: 'natural',
        hmsResponsible: 'Maria Atendente',
      },
      intake: {
        id: '5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd',
        version: 1,
        legalAreaId: '4a664059-7f45-435f-b5b3-407d8f1652b6',
        legalTopicId: 'fd56da99-08c5-4adb-b153-217872297b08',
        origin: 'website',
        attendantName: 'Maria Atendente',
      },
      relevantFacts: [],
      potentialLegalRequests: [],
    } as any,
    responsible: {
      id: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
      professionalName: 'Maria Atendente',
    } as any,
    markNoShow: vi.fn(),
    rescheduleConsultation: vi.fn(),
    completeConsultation: handleCompleteConsultation,
    finalizeAttendance: handleFinalizeAttendance,
    isFinalizingAttendance: false,
    editAttendance: handleEditAttendance,
    isEditingAttendance: false,
    editAttendanceError: null,
    ...controllerOverrides,
  }
}

vi.mock('@/ui/consultation/hooks/use-consultation', () => ({
  useConsultation: () => useConsultationTestController(),
}))

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    legalCatalogService: {
      listLegalAreas: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      listLegalTopics: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
    },
    intakeService: {
      closeIntakeWithoutContract: closeIntakeWithoutContractMock,
    },
    dynamicFormService: {
      listDynamicForms: listDynamicFormsMock,
    },
  }),
}))

function renderAttendanceFormPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ConsultationPageActionProvider>
        <ConsultationPagePrimaryAction />
        <AttendanceForm
          consultationId='a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
          onBack={handleBack}
        />
      </ConsultationPageActionProvider>
    </QueryClientProvider>,
  )
}

describe('AttendanceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
    controllerOverrides = {}
    listDynamicFormsMock.mockResolvedValue({ isFailure: false, body: [] })
    closeIntakeWithoutContractMock.mockResolvedValue({
      isFailure: false,
      body: {},
    })
  })

  afterEach(cleanup)

  it('initializes and populates HMS responsible input with attendant name from consultation', async () => {
    renderAttendanceFormPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Maria Atendente')).toBeTruthy()
      expect(screen.getByDisplayValue('Morris Lemke')).toBeTruthy()
    })
  })

  it('collapses and expands an attendance form card', async () => {
    renderAttendanceFormPage()

    const qualificationHeading = await screen.findByRole('heading', {
      name: 'Qualificação da Pessoa',
    })
    const qualificationCard = qualificationHeading.closest('section')

    expect(qualificationCard).not.toBeNull()

    const card = qualificationCard as HTMLElement
    const collapseButton = within(card).getByRole('button', { name: 'Recolher card' })

    expect(collapseButton.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(collapseButton)

    const expandButton = within(card).getByRole('button', { name: 'Expandir card' })
    expect(expandButton.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(expandButton)

    expect(
      within(card)
        .getByRole('button', { name: 'Recolher card' })
        .getAttribute('aria-expanded'),
    ).toBe('true')
  })

  it('displays the empty state when no relevant facts are registered', async () => {
    renderAttendanceFormPage()

    expect(await screen.findByText('Nenhum fato registrado')).toBeTruthy()
  })

  it('renders the fields of the dynamic form selected in the dialog', async () => {
    const firstForm = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Triagem Cível',
      contexts: [],
      fields: [
        {
          id: 'civil-relationship',
          key: 'civil_relationship',
          label: 'Tipo de relação jurídica',
          type: 'short_text',
          position: 1,
          required: false,
        },
      ],
    }
    const secondForm = {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Entrevista Cível',
      contexts: [],
      fields: [
        {
          id: 'desired-outcome',
          key: 'desired_outcome',
          label: 'Resultado pretendido pelo cliente',
          type: 'long_text',
          position: 1,
          required: false,
        },
      ],
    }

    controllerOverrides = {
      consultation: {
        ...useConsultationTestController().consultation,
        dynamicFormSnapshot: {
          dynamicFormId: firstForm.id,
          name: firstForm.name,
          fields: firstForm.fields,
        },
      } as any,
    }
    listDynamicFormsMock.mockResolvedValue({
      isFailure: false,
      body: [firstForm, secondForm],
    })

    renderAttendanceFormPage()

    fireEvent.click(await screen.findByRole('button', { name: /Triagem Cível/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Entrevista Cível/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Usar ficha dinâmica' }))

    expect(await screen.findByText('Resultado pretendido pelo cliente')).toBeTruthy()
    expect(screen.queryByText('Tipo de relação jurídica')).toBeNull()
  })

  it('disables finalization while required conclusion fields are empty', async () => {
    controllerOverrides = {
      isLoading: false,
      consultation: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'pending',
        modality: 'in_person',
        assignedLawyerId: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
        primaryLegalQuestion: '',
        guidanceProvided: '',
        viability: '',
        decision: '',
        intake: {
          legalAreaId: '4a664059-7f45-435f-b5b3-407d8f1652b6',
          legalTopicId: 'fd56da99-08c5-4adb-b153-217872297b08',
        },
        client: { name: 'Morris Lemke', type: 'natural' },
      } as any,
    }

    renderAttendanceFormPage()

    const submitButton = await screen.findByRole('button', {
      name: /Finalizar ficha de atendimento/i,
    })
    expect((submitButton as HTMLButtonElement).disabled).toBe(true)
    expect(handleFinalizeAttendance).not.toHaveBeenCalled()
  })

  it('disables finalization when the consultation is not pending', async () => {
    controllerOverrides = {
      consultation: {
        ...useConsultationTestController().consultation,
        status: 'completed',
      } as any,
    }

    renderAttendanceFormPage()

    const submitButton = await screen.findByRole('button', {
      name: /Finalizar ficha de atendimento/i,
    })
    expect((submitButton as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(submitButton)
    expect(handleFinalizeAttendance).not.toHaveBeenCalled()
  })

  it('requires the closing decision when viability is not viable', async () => {
    renderAttendanceFormPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Inviável' }))

    const proceedButton = screen.getByRole('button', {
      name: 'Prosseguir para contratação',
    })
    expect((proceedButton as HTMLButtonElement).disabled).toBe(true)
    expect(
      screen
        .getByRole('button', { name: 'Encerrar sem contratação' })
        .getAttribute('aria-pressed'),
    ).toBe('true')

    const closeButton = screen.getByRole('button', {
      name: 'Confirmar encerramento sem contratação',
    })
    expect((closeButton as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(closeButton)

    expect(
      await screen.findByRole('heading', {
        name: 'Encerrar sem contratação?',
      }),
    ).toBeTruthy()
    expect(handleFinalizeAttendance).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: 'Outro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar sem contratação' }))

    await waitFor(() => {
      expect(handleFinalizeAttendance).toHaveBeenCalled()
      expect(closeIntakeWithoutContractMock).toHaveBeenCalledWith(
        '5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd',
        expect.objectContaining({
          closureReason: 'other',
          closureNotes: undefined,
        }),
      )
      expect(handleBack).toHaveBeenCalled()
    })
  })

  it('renders a finalized attendance as read-only with an edit action', async () => {
    controllerOverrides = {
      consultation: {
        ...useConsultationTestController().consultation,
        attendanceFinalizedAt: '2026-08-19T12:00:00.000Z',
      } as any,
    }

    renderAttendanceFormPage()

    const editButton = await screen.findByRole('button', { name: 'Editar ficha' })
    expect(editButton.hasAttribute('disabled')).toBe(false)
    fireEvent.click(editButton)
    await waitFor(() => expect(handleEditAttendance).toHaveBeenCalled())
    expect(
      screen.queryByRole('button', { name: /Finalizar ficha de atendimento/i }),
    ).toBeNull()
    expect(screen.getByLabelText('Nome completo').closest('fieldset')).not.toBeNull()
    expect(
      screen
        .getByLabelText('Nome completo')
        .closest('fieldset')
        ?.hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByLabelText(/Questão jurídica principal/).getAttribute('readonly'),
    ).toBe('')
  })

  it('submits qualification and completes consultation when form is valid', async () => {
    renderAttendanceFormPage()

    expect(screen.queryByRole('button', { name: 'Nova consulta' })).toBeNull()

    const submitButton = await screen.findByRole('button', {
      name: /Finalizar ficha de atendimento/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(handleFinalizeAttendance).toHaveBeenCalled()
      expect(handleBack).toHaveBeenCalled()
    })
  })

  it('shows the server error when attendance finalization fails', async () => {
    handleFinalizeAttendance.mockRejectedValueOnce(
      new Error(
        'Somente o advogado associado ou um administrador pode finalizar a ficha de atendimento.',
      ),
    )

    renderAttendanceFormPage()

    const submitButton = await screen.findByRole('button', {
      name: /Finalizar ficha de atendimento/i,
    })
    fireEvent.click(submitButton)

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Somente o advogado associado ou um administrador pode finalizar a ficha de atendimento.',
    )
  })
})
