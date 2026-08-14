import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AttendanceForm } from '../attendance-form/attendance-form'
import type { useConsultation } from '../use-consultation'

const handleCompleteConsultation = vi.fn().mockResolvedValue(undefined)
const handleUpdateQualification = vi.fn().mockResolvedValue(undefined)
const handleBack = vi.fn()

type ControllerOverrides = Partial<ReturnType<typeof useConsultation>>

let controllerOverrides: ControllerOverrides = {}

function useConsultationTestController(): ReturnType<typeof useConsultation> {
  return {
    isLoading: false,
    isError: false,
    error: null,
    isStarting: false,
    isMarkingNoShow: false,
    isRescheduling: false,
    isCompleting: false,
    isUpdatingQualification: false,
    consultation: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'pending',
      createdAt: '2026-08-06T20:10:31.107Z',
      notes: 'Notas prévias do advogado',
      primaryLegalQuestion: 'Questão jurídica principal válida',
      guidanceProvided: 'Orientação prestada ao cliente válida',
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
    startConsultation: vi.fn(),
    markNoShow: vi.fn(),
    rescheduleConsultation: vi.fn(),
    updateQualification: handleUpdateQualification,
    completeConsultation: handleCompleteConsultation,
    ...controllerOverrides,
  }
}

vi.mock('../use-consultation', () => ({
  useConsultation: () => useConsultationTestController(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    legalCatalogService: {
      listLegalAreas: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      listLegalTopics: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
    },
  }),
}))

function renderAttendanceFormPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AttendanceForm
        consultationId='a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        onBack={handleBack}
      />
    </QueryClientProvider>,
  )
}

describe('AttendanceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.scrollTo = vi.fn()
    controllerOverrides = {}
  })

  afterEach(cleanup)

  it('initializes and populates HMS responsible input with attendant name from consultation', async () => {
    renderAttendanceFormPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Maria Atendente')).toBeTruthy()
      expect(screen.getByDisplayValue('Morris Lemke')).toBeTruthy()
    })
  })

  it('delegates backward navigation action', async () => {
    renderAttendanceFormPage()

    const backButton = await screen.findByRole('button', { name: /Voltar/i })
    fireEvent.click(backButton)

    expect(handleBack).toHaveBeenCalledOnce()
  })

  it('prevents submission and displays validation errors when required conclusion fields are empty', async () => {
    controllerOverrides = {
      isLoading: false,
      consultation: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        primaryLegalQuestion: '',
        guidanceProvided: '',
        client: { name: 'Morris Lemke', type: 'natural' },
        intake: {},
      } as any,
    }

    renderAttendanceFormPage()

    const submitButton = await screen.findByRole('button', {
      name: /Finalizar consulta/i,
    })
    fireEvent.click(submitButton)

    expect(
      await screen.findByText('A questão jurídica principal é obrigatória.'),
    ).toBeTruthy()
    expect(
      await screen.findByText('A orientação prestada ao cliente é obrigatória.'),
    ).toBeTruthy()
    expect(handleCompleteConsultation).not.toHaveBeenCalled()
  })

  it('submits qualification and completes consultation when form is valid', async () => {
    renderAttendanceFormPage()

    const submitButton = await screen.findByRole('button', {
      name: /Finalizar consulta/i,
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(handleUpdateQualification).toHaveBeenCalled()
      expect(handleCompleteConsultation).toHaveBeenCalled()
      expect(handleBack).toHaveBeenCalled()
    })
  })
})
