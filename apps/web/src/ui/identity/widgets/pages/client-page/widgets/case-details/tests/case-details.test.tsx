import { render, screen, fireEvent } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateToMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ caseId: 'intake-1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({
    navigateTo: navigateToMock,
  }),
}))

import { CaseDetails } from '../index'
import { useCaseDetails } from '../use-case-details'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

vi.mock('../use-case-details', () => ({
  useCaseDetails: vi.fn(),
}))

const useCaseDetailsMock = vi.mocked(useCaseDetails)

const mockCaseDetails = {
  id: 'intake-1',
  sequenceNumber: 42,
  clientId: 'client-1',
  responsibleId: 'user-1',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  origin: 'direct' as const,
  contactChannel: 'whatsapp' as const,
  legalAreaId: 'area-1',
  legalTopicId: 'topic-1',
  urgency: 'normal' as const,
  demandNotes: 'Notas do caso.',
  status: IntakeStatus.ConsultationCompleted,
  version: 1,
  createdAt: new Date('2026-07-28T14:32:00.000Z'),
  updatedAt: new Date('2026-07-29T15:30:00.000Z'),
}

describe('CaseDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders error block when loading details fails or case is missing', () => {
    useCaseDetailsMock.mockReturnValue({
      caseId: 'intake-1',
      caseDetails: null,
      steps: [],
      activeStep: 0,
      documents: [],
      timeline: [],
      messages: [],
      error: new Error('fetch error'),
      isLoading: false,
    })

    render(<CaseDetails />)

    expect(screen.getByText('Erro ao carregar detalhes')).toBeTruthy()
    expect(
      screen.getByText('Não foi possível recuperar os dados do seu caso. Por favor, tente novamente.'),
    ).toBeTruthy()
  })

  it('renders loading skeletons when case details is loading', () => {
    useCaseDetailsMock.mockReturnValue({
      caseId: 'intake-1',
      caseDetails: null,
      steps: [],
      activeStep: 0,
      documents: [],
      timeline: [],
      messages: [],
      error: null,
      isLoading: true,
    })

    render(<CaseDetails />)

    // Verify presence of elements during loading state (using skeletons/animate pulse)
    expect(screen.queryByText('Checklist de Documentação')).toBeNull()
  })

  it('renders the details layout, document list, and calls back navigation', () => {
    useCaseDetailsMock.mockReturnValue({
      caseId: 'intake-1',
      caseDetails: mockCaseDetails,
      steps: [
        { label: 'Registro', description: 'desc' },
        { label: 'Consulta', description: 'desc' },
      ],
      activeStep: 1,
      documents: [
        { name: 'Documento de Identidade (RG/CNH)', status: 'approved', updatedAt: '2026-07-28' },
        { name: 'Contrato de Honorários', status: 'pending', updatedAt: '-' },
      ],
      timeline: [
        { date: '28/07/2026', time: '14:32', title: 'Caso registrado', desc: 'Desc timeline' },
      ],
      messages: [
        { sender: 'Secretaria HMS', role: 'Atendimento', date: 'Hoje', content: 'Mensagem de teste' },
      ],
      error: null,
      isLoading: false,
    })

    render(<CaseDetails />)

    // Check heading action type (default mapping 'Petição Inicial / Cível')
    expect(screen.getByText('Petição Inicial / Cível')).toBeTruthy()
    expect(screen.getByText('Caso #42 • ID: intake-1')).toBeTruthy()

    // Document Checklist
    expect(screen.getByText('Checklist de Documentação')).toBeTruthy()
    expect(screen.getByText('Documento de Identidade (RG/CNH)')).toBeTruthy()
    expect(screen.getByText('Contrato de Honorários')).toBeTruthy()

    // Timeline and Messages
    expect(screen.getByText('Andamento do Processo')).toBeTruthy()
    expect(screen.getByText('Caso registrado')).toBeTruthy()
    expect(screen.getByText('Mensagens do Escritório')).toBeTruthy()
    expect(screen.getByText('Mensagem de teste')).toBeTruthy()

    // Back Button Click
    const backBtn = screen.getByRole('button', { name: /voltar/i })
    expect(backBtn).toBeTruthy()
    fireEvent.click(backBtn)

    expect(navigateToMock).toHaveBeenCalledWith('clientMyCases')
  })
})
