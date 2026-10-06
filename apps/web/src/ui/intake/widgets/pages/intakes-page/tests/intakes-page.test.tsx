import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { IntakesPage } from '..'
import { useIntakesPage } from '../use-intakes-page'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: AnchorProps) => (
    <a
      href={
        route === 'newIntake'
          ? '/intakes/novo'
          : route === 'intakeDetails'
            ? `/intakes/${params?.intakeId}`
            : '/intakes'
      }
      {...props}
    >
      {children}
    </a>
  ),
}))

vi.mock('../use-intakes-page', () => ({
  useIntakesPage: vi.fn(),
}))

const useIntakesPageMock = vi.mocked(useIntakesPage)

const intake = {
  intakeId: 'intake-1',
  displayId: 'INT-0142',
  createdAt: '2026-08-18T12:00:00.000Z',
  client: {
    clientId: 'client-1',
    name: 'Ana Beatriz',
    maskedTaxId: '***.***.***-25',
  },
  responsible: {
    responsibleId: 'responsible-1',
    professionalName: 'Marina Costa',
  },
  demandNotes: 'Orientação sobre rescisão contratual',
  origin: 'direct',
  contactChannel: 'whatsapp',
  status: 'consultation_scheduled',
}

function createPageResult(overrides: Record<string, unknown> = {}) {
  return {
    searchParams: {
      search: '',
      status: null,
      responsibleId: null,
      origin: null,
      contactChannel: null,
      registeredFrom: null,
      registeredTo: null,
      page: 1,
      pageSize: 20,
    },
    intakes: {
      data: {
        items: [intake],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
        statusCounts: {
          all: 1,
          byStatus: {
            consultation_scheduling: 0,
            consultation_scheduling_failed: 0,
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
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    },
    responsibles: { data: [], isLoading: false, isError: false },
    hasFilters: false,
    page: 1,
    totalPages: 1,
    updateSearchParams: vi.fn(),
    clearSearchParams: vi.fn(),
    ...overrides,
  }
}

describe('IntakesPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useIntakesPageMock.mockReturnValue(createPageResult() as never)
  })

  it('renders the operational table and primary creation action', () => {
    render(<IntakesPage />)

    expect(screen.getByRole('heading', { name: 'Intakes' })).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'Atendente' })).toBeDefined()
    expect(screen.getByText('INT-0142')).toBeDefined()
    expect(screen.getByText('Ana Beatriz')).toBeDefined()
    expect(screen.getByText('MC')).toBeDefined()
    expect(screen.getByText('Orientação sobre rescisão contratual')).toBeDefined()
    expect(screen.getByRole('tab', { name: /Consulta agendada/ })).toBeDefined()
    expect(screen.getByRole('link', { name: /Novo Intake/ }).getAttribute('href')).toBe(
      '/intakes/novo',
    )
  })

  it('renders an actions menu for each intake row', () => {
    render(<IntakesPage />)

    expect(screen.getByRole('columnheader', { name: 'Ações' })).toBeDefined()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Ações de INT-0142' }), {
      button: 0,
    })

    expect(
      screen.getByRole('menuitem', { name: 'Acessar detalhes' }).getAttribute('href'),
    ).toBe('/intakes/intake-1')
    expect(screen.getByRole('menuitem', { name: 'Copiar protocolo' })).toBeDefined()
  })

  it('offers a visible retry action when the list request fails', () => {
    const refetch = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createPageResult({
        intakes: { data: undefined, isLoading: false, isError: true, refetch },
      }) as never,
    )

    render(<IntakesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(refetch).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar os Intakes',
    )
  })

  it('offers to clear filters when the filtered list is empty', () => {
    const clearSearchParamsMock = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createPageResult({
        intakes: {
          data: {
            ...createPageResult().intakes.data,
            items: [],
            total: 0,
            totalPages: 0,
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        },
        hasFilters: true,
        clearSearchParams: clearSearchParamsMock,
      }) as never,
    )

    render(<IntakesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(clearSearchParamsMock).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('heading', { name: 'Nenhum Intake encontrado' }),
    ).toBeDefined()
  })

  it('renders loading skeletons while the list is pending', () => {
    useIntakesPageMock.mockReturnValue(
      createPageResult({
        intakes: { data: undefined, isLoading: true, isError: false, refetch: vi.fn() },
      }) as never,
    )

    render(<IntakesPage />)

    expect(
      screen.getByRole('region', { name: 'Carregando lista de Intakes' }),
    ).toBeDefined()
    expect(screen.queryByRole('columnheader', { name: 'ID' })).toBeNull()
  })

  it('opens advanced filters in a dialog and applies them together', () => {
    const updateSearchParamsMock = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createPageResult({ updateSearchParams: updateSearchParamsMock }) as never,
    )

    render(<IntakesPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    expect(screen.getByRole('dialog')).toBeDefined()

    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por origem' }), {
      target: { value: 'referral' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(updateSearchParamsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'referral',
        responsibleId: null,
        contactChannel: null,
      }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('updates search and status filters and shows the unfiltered empty state', () => {
    const updateSearchParamsMock = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createPageResult({
        intakes: {
          data: {
            ...createPageResult().intakes.data,
            items: [],
            total: 0,
            totalPages: 0,
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        },
        updateSearchParams: updateSearchParamsMock,
      }) as never,
    )

    render(<IntakesPage />)
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Buscar por ID, cliente ou demanda' }),
      {
        target: { value: 'Ana' },
      },
    )
    fireEvent.keyDown(screen.getByRole('tab', { name: /Contratado/ }), { key: 'Enter' })

    expect(updateSearchParamsMock).toHaveBeenNthCalledWith(1, { search: 'Ana' })
    expect(updateSearchParamsMock).toHaveBeenNthCalledWith(2, { status: 'contracted' })
    expect(
      screen.getByRole('heading', { name: 'Nenhum Intake registrado' }),
    ).toBeDefined()
    expect(screen.getAllByRole('link', { name: 'Novo Intake' })).toHaveLength(2)
  })

  it('applies a custom registration range and clears advanced filters', () => {
    const updateSearchParamsMock = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createPageResult({ updateSearchParams: updateSearchParamsMock }) as never,
    )

    render(<IntakesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Filtrar por período de registro' }),
      {
        target: { value: 'custom' },
      },
    )
    fireEvent.change(screen.getByLabelText('Data inicial de registro'), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText('Data final de registro'), {
      target: { value: '2026-08-31' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(updateSearchParamsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        registeredFrom: '2026-08-01',
        registeredTo: '2026-08-31',
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(updateSearchParamsMock).toHaveBeenLastCalledWith({
      responsibleId: null,
      origin: null,
      contactChannel: null,
      registeredFrom: null,
      registeredTo: null,
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows pagination boundaries and requests the adjacent page', () => {
    const updateSearchParamsMock = vi.fn()
    useIntakesPageMock.mockReturnValue(
      createPageResult({
        intakes: {
          data: {
            ...createPageResult().intakes.data,
            page: 2,
            pageSize: 10,
            total: 25,
            totalPages: 3,
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        },
        page: 2,
        totalPages: 3,
        updateSearchParams: updateSearchParamsMock,
      }) as never,
    )

    render(<IntakesPage />)
    expect(
      screen.getByRole('navigation', { name: 'Paginação de Intakes' }).textContent,
    ).toContain('Exibindo 11–20 de 25 Intakes')
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(updateSearchParamsMock).toHaveBeenNthCalledWith(1, { page: 1 })
    expect(updateSearchParamsMock).toHaveBeenNthCalledWith(2, { page: 3 })
  })

  it('renders status variants, missing values, and an invalid registration date safely', () => {
    const statuses = [
      'consultation_scheduling_failed',
      'consultation_completed',
      'viability_registered',
      'consultation_scheduling',
      'closed_without_contract',
      'unknown_status',
    ]
    const items = statuses.map((status, index) => ({
      ...intake,
      intakeId: `intake-${index}`,
      displayId: `INT-${index}`,
      status,
      createdAt: index === 0 ? 'invalid-date' : intake.createdAt,
      demandNotes: null,
      contactChannel: 'unknown-channel',
    }))
    useIntakesPageMock.mockReturnValue(
      createPageResult({
        intakes: {
          data: { ...createPageResult().intakes.data, items },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        },
      }) as never,
    )

    render(<IntakesPage />)

    expect(screen.getAllByText('Agendamento com falha').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Consulta realizada').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Viabilidade registrada').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agendando consulta').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Encerrado sem contratação').length).toBeGreaterThan(0)
    expect(screen.getByText('unknown_status')).toBeDefined()
    expect(screen.getByText('—')).toBeDefined()
    expect(screen.getAllByText('Sem descrição registrada')).toHaveLength(statuses.length)
    expect(screen.getAllByText('unknown-channel')).toHaveLength(statuses.length)
  })
})
