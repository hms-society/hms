import type { ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClientCommunicationsTabProps } from '../client-communications-tab'
import type { ClientDocumentsTabProps } from '../client-documents-tab'
import type { ClientRegistrationDataTabProps } from '../client-registration-data-tab'
import { ConsentType } from '@hms/core/identity/domain/structures'
import type { ClientConsent } from '@hms/core/identity/domain/entities'
import { ClientDetailsPage } from '../index'
import { useClientDetailsPage } from '../use-client-details-page'

vi.mock('../use-client-details-page', () => ({
  useClientDetailsPage: vi.fn(),
}))

vi.mock('../client-registration-data-tab', () => ({
  ClientRegistrationDataTab: ({ clientId }: ClientRegistrationDataTabProps) => (
    <div>Registration data for {clientId}</div>
  ),
}))

vi.mock('../client-communications-tab', () => ({
  ClientCommunicationsTab: ({ clientId }: ClientCommunicationsTabProps) => (
    <div>Communications for {clientId}</div>
  ),
}))

vi.mock('../client-documents-tab', () => ({
  ClientDocumentsTab: ({ clientId }: ClientDocumentsTabProps) => (
    <div>Documents for {clientId}</div>
  ),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: vi.fn(), navigateCollaboratorsSearch: vi.fn() }),
}))

const useClientDetailsPageMock = vi.mocked(useClientDetailsPage)
const handleTabChangeMock = vi.fn()

const client = {
  id: 'client-1',
  type: 'natural' as const,
  name: 'Ana Ribeiro',
  taxId: { type: 'cpf' as const, value: '12345678900' },
  phone: '5511999999999',
  email: 'ana@example.com',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}
const consent: ClientConsent = {
  id: 'consent-1',
  clientId: client.id,
  type: ConsentType.DataProcessing,
  grantedAt: new Date('2026-01-01'),
}

type PageState = Extract<ReturnType<typeof useClientDetailsPage>, { status: string }>

function makePageState(overrides: Partial<PageState> = {}): PageState {
  return {
    activeTab: 'dados-cadastrais',
    clientData: { client, consents: [consent] },
    clientError: null,
    consents: [consent],
    currentStyle: { avatar: 'avatar', badge: 'badge', text: 'text' },
    displayName: 'Ana Ribeiro',
    handleTabChange: handleTabChangeMock,
    initials: 'AR',
    intakes: [],
    isLoading: false,
    maskPhone: (value = '') => `phone:${value}`,
    maskTaxId: (value = '') => `tax:${value}`,
    status: 'Potencial',
    ...overrides,
  }
}

describe('ClientDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClientDetailsPageMock.mockReturnValue(makePageState())
  })

  afterEach(cleanup)

  it('renders a loading state while client details are being fetched', () => {
    useClientDetailsPageMock.mockReturnValue({
      activeTab: 'dados-cadastrais',
      clientData: undefined,
      clientError: null,
      handleTabChange: handleTabChangeMock,
      intakes: [],
      isLoading: true,
      maskPhone: (value = '') => `phone:${value}`,
      maskTaxId: (value = '') => `tax:${value}`,
    })

    render(<ClientDetailsPage clientId='client-1' />)

    expect(screen.getByText('Carregando ficha do cliente...').textContent).toBe(
      'Carregando ficha do cliente...',
    )
    expect(screen.queryByRole('heading', { name: 'Ana Ribeiro' })).toBeNull()
  })

  it('shows an error state when the client details cannot be resolved', () => {
    useClientDetailsPageMock.mockReturnValue({
      activeTab: 'dados-cadastrais',
      clientData: undefined,
      clientError: new Error('offline'),
      handleTabChange: handleTabChangeMock,
      intakes: [],
      isLoading: false,
      maskPhone: (value = '') => `phone:${value}`,
      maskTaxId: (value = '') => `tax:${value}`,
    })

    render(<ClientDetailsPage clientId='client-1' />)

    expect(screen.getByText('Erro ao carregar dados do cliente.').textContent).toBe(
      'Erro ao carregar dados do cliente.',
    )
  })

  it('renders the client identity, consent count, and initial registration tab', () => {
    render(<ClientDetailsPage clientId='client-1' />)

    expect(screen.getByRole('heading', { name: 'Ana Ribeiro' }).textContent).toBe(
      'Ana Ribeiro',
    )
    expect(screen.getByText('AR').textContent).toBe('AR')
    expect(screen.getByText('1 consentimento(s)').textContent).toBe('1 consentimento(s)')
    expect(screen.getByText('tax:12345678900').textContent).toBe('tax:12345678900')
    expect(screen.getByText('phone:5511999999999').textContent).toBe(
      'phone:5511999999999',
    )
    expect(
      screen.getByRole('tab', { name: /Dados cadastrais/ }).getAttribute('aria-selected'),
    ).toBe('true')
    expect(screen.getByText('Registration data for client-1').textContent).toBe(
      'Registration data for client-1',
    )
  })

  it('uses the empty-value fallbacks when contact details and consents are unavailable', () => {
    useClientDetailsPageMock.mockReturnValue(
      makePageState({
        clientData: {
          client: {
            ...client,
            taxId: { type: 'cpf', value: '' },
            phone: undefined,
            email: '',
          },
          consents: [],
        },
        consents: [],
      }),
    )

    render(<ClientDetailsPage clientId='client-1' />)

    expect(screen.getByText('-').textContent).toBe('-')
    expect(screen.getAllByText('Não informado')).toHaveLength(2)
    expect(screen.queryByText(/consentimento\(s\)/)).toBeNull()
  })

  it('delegates tab selection and renders the active documents tab', () => {
    useClientDetailsPageMock.mockReturnValue(makePageState({ activeTab: 'documentos' }))

    render(<ClientDetailsPage clientId='client-1' />)

    const documentsTab = screen.getByRole('tab', { name: /Documentos/ })
    expect(documentsTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Documents for client-1').textContent).toBe(
      'Documents for client-1',
    )

    fireEvent.mouseDown(screen.getByRole('tab', { name: /Comunicações/ }), {
      button: 0,
      ctrlKey: false,
    })

    expect(handleTabChangeMock).toHaveBeenCalledWith('comunicacoes')
  })
})
