import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ContactChannel,
  IntakeOrigin,
  IntakeStatus,
} from '@hms/core/intake/domain/structures'

import type { IntakesPageController } from '../use-intakes-page'
import { useIntakesPage } from '../use-intakes-page'
import { IntakesPage } from '../index'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ROUTES } from '@/constants/routes'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params, route, ...props }: AnchorProps) => (
    <a
      href={
        params?.intakeId
          ? ROUTES[route].replace('$intakeId', params.intakeId)
          : ROUTES[route]
      }
      {...props}
    >
      {children}
    </a>
  ),
}))

vi.mock('../use-intakes-page', () => ({ useIntakesPage: vi.fn() }))

const useIntakesPageMock = vi.mocked(useIntakesPage)
const responsible = { responsibleId: 'responsible-1', professionalName: 'Ana Ribeiro' }
const item = {
  intakeId: 'intake-1',
  displayId: 'INT-00042',
  createdAt: new Date('2026-07-30T12:00:00.000Z'),
  client: { clientId: 'client-1', name: 'Maria Oliveira', maskedTaxId: '***.982.247-**' },
  responsible,
  demandNotes: 'Verbas rescisórias',
  origin: IntakeOrigin.Direct,
  contactChannel: ContactChannel.Whatsapp,
  status: IntakeStatus.ConsultationScheduled,
}

function createController(
  overrides: Partial<IntakesPageController> = {},
): IntakesPageController {
  return {
    copiedIntakeId: undefined,
    hasActiveFilters: false,
    intakesPage: {
      items: [item],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      statusCounts: {
        all: 1,
        byStatus: {
          consultation_scheduled: 1,
          consultation_completed: 0,
          viability_registered: 0,
          in_formalization: 0,
          contracted: 0,
          closed_without_contract: 0,
        },
        compatibility: { registered: 0 },
      },
    },
    intakesPageError: null,
    isLoadingIntakes: false,
    isLoadingResponsibles: false,
    page: 1,
    query: { page: 1, pageSize: 20 },
    responsibles: [responsible],
    responsiblesError: null,
    searchParams: {
      search: null,
      status: null,
      responsibleId: null,
      origin: null,
      contactChannel: null,
      registeredFrom: null,
      registeredTo: null,
      page: 1,
      pageSize: 20,
    },
    totalPages: 1,
    handleClearFilters: vi.fn(),
    handleCopyIntakeId: vi.fn(),
    handleRetry: vi.fn(),
    handleRetryResponsibles: vi.fn(),
    handleUpdateSearch: vi.fn(),
    ...overrides,
  }
}

describe('IntakesPage', () => {
  afterEach(cleanup)
  beforeEach(() => vi.clearAllMocks())

  it('renders the successful intake list and responsible filter', () => {
    useIntakesPageMock.mockReturnValue(createController())
    render(<IntakesPage />)

    expect(screen.getByRole('heading', { name: 'Intakes' })).toBeDefined()
    expect(screen.getByText('Maria Oliveira')).toBeDefined()
    expect(screen.getByText('Verbas rescisórias')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    expect(screen.getAllByRole('combobox', { name: 'Responsável' })[0]).toBeDefined()
    expect(screen.getByRole('tab', { name: /Consulta agendada/ }).textContent).toContain(
      '1',
    )
  })

  it('opens the detail from the row by click or keyboard without hijacking copy', () => {
    const handleCopyId = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createController({ handleCopyIntakeId: handleCopyId }),
    )
    render(<IntakesPage />)

    const detailLink = screen.getByRole('link', { name: 'Ver detalhes de INT-00042' })
    const row = detailLink.closest('tr')
    expect(detailLink.getAttribute('href')).toBe('/intakes/intake-1')
    expect(row?.getAttribute('tabindex')).toBe('0')

    detailLink.focus()
    expect(document.activeElement).toBe(detailLink)

    fireEvent.keyDown(row as HTMLElement, { key: 'Enter' })

    fireEvent.click(screen.getByRole('button', { name: 'Copiar ID INT-00042' }))
    expect(handleCopyId).toHaveBeenCalledWith('INT-00042')
  })

  it('renders loading, empty, filtered-empty, and error recovery states', () => {
    useIntakesPageMock.mockReturnValue(
      createController({ isLoadingIntakes: true, intakesPage: null }),
    )
    render(<IntakesPage />)
    expect(screen.getByRole('status', { name: /carregando/i })).toBeDefined()

    cleanup()
    useIntakesPageMock.mockReturnValue(createController({ intakesPage: null }))
    render(<IntakesPage />)
    expect(screen.getByText('Ainda não há intakes')).toBeDefined()
    expect(screen.getAllByRole('link', { name: 'Novo Intake' })).toHaveLength(2)

    const handleClearFilters = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createController({
        intakesPage: {
          items: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
          statusCounts: {
            all: 0,
            byStatus: {
              consultation_scheduled: 0,
              consultation_completed: 0,
              viability_registered: 0,
              in_formalization: 0,
              contracted: 0,
              closed_without_contract: 0,
            },
            compatibility: { registered: 0 },
          },
        },
        hasActiveFilters: true,
        handleClearFilters,
      }),
    )
    cleanup()
    render(<IntakesPage />)
    expect(screen.getByText('Nenhum intake encontrado')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(handleClearFilters).toHaveBeenCalledOnce()

    const handleRetry = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createController({
        intakesPage: null,
        intakesPageError: new Error('offline'),
        handleRetry,
      }),
    )
    cleanup()
    render(<IntakesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledOnce()
  })

  it('shows responsible loading and error-retry copy', () => {
    const handleRetryResponsibles = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createController({
        isLoadingResponsibles: true,
        responsibles: [],
        responsiblesError: new Error('offline'),
        handleRetryResponsibles,
      }),
    )
    render(<IntakesPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    expect(screen.getAllByRole('combobox', { name: 'Responsável' })[0]).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar os responsáveis.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetryResponsibles).toHaveBeenCalledOnce()
  })

  it('delegates keyboard-friendly filter, copy, and status interactions', () => {
    const handleUpdateSearch = vi.fn()
    const handleCopyId = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createController({ handleUpdateSearch, handleCopyIntakeId: handleCopyId }),
    )
    render(<IntakesPage />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar intake' }), {
      target: { value: 'Maria' },
    })
    fireEvent.click(screen.getByRole('tab', { name: /Consulta agendada/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Copiar ID INT-00042' }))

    expect(handleUpdateSearch).toHaveBeenCalledWith({ search: 'Maria' })
    expect(handleUpdateSearch).toHaveBeenCalledWith({ status: 'consultation_scheduled' })
    expect(handleCopyId).toHaveBeenCalledWith('INT-00042')
  })

  it('renders every available page and changes page when selected', () => {
    const handleUpdateSearch = vi.fn()
    const controller = createController()

    if (!controller.intakesPage) throw new Error('Expected an intake page fixture')

    useIntakesPageMock.mockReturnValue(
      createController({
        handleUpdateSearch,
        totalPages: 3,
        intakesPage: {
          ...controller.intakesPage,
          total: 41,
          totalPages: 3,
        },
      }),
    )
    render(<IntakesPage />)

    expect(screen.getByRole('navigation', { name: 'Paginação de intakes' })).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Página 1' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(screen.getByRole('button', { name: 'Página 2' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Página 3' })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }))

    expect(handleUpdateSearch).toHaveBeenCalledWith({ page: 2 })
  })
})
