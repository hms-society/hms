import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientCaseDrawer } from '../index'
import * as drawerHookModule from '../use-client-case-drawer'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

describe('ClientCaseDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  it('renders case details when client has cases', () => {
    vi.spyOn(drawerHookModule, 'useClientCaseDrawer').mockReturnValue({
      clientCases: [
        {
          id: 'case-1',
          publicCode: 'CASO-20260916-0001',
          title: 'Aposentadoria Antônio',
          clientName: 'Antônio Carvalho',
          legalArea: 'Previdenciário',
          status: 'documentation' as any,
          openedAt: new Date(),
          updatedAt: new Date(),
          checklistGate: {},
          dossierGate: {},
          team: [
            {
              collaboratorId: 'col-1',
              name: 'Dr. Silva',
              role: 'lead' as any,
              isPrimary: true,
            },
          ],
        },
      ],
      activeCase: {
        id: 'case-1',
        publicCode: 'CASO-20260916-0001',
        title: 'Aposentadoria Antônio',
        clientName: 'Antônio Carvalho',
        legalArea: 'Previdenciário',
        status: 'documentation' as any,
        openedAt: new Date(),
        updatedAt: new Date(),
        checklistGate: {},
        dossierGate: {},
        team: [
          {
            collaboratorId: 'col-1',
            name: 'Dr. Silva',
            role: 'lead' as any,
            isPrimary: true,
          },
        ],
      },
      selectedCaseId: 'case-1',
      setSelectedCaseId: vi.fn(),
      isLoading: false,
      checklistItems: [],
      completionPercentage: 75,
      validatedItemsCount: 3,
      pendingItemsCount: 1,
      totalChecklistItems: 4,
    })

    render(
      <ClientCaseDrawer
        clientId='client-1'
        clientName='Antônio Carvalho'
        open={true}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Aposentadoria Antônio')).toBeTruthy()
    expect(screen.getByText('CASO-20260916-0001')).toBeTruthy()
    expect(screen.getByText('Previdenciário')).toBeTruthy()
    expect(screen.getByText('75% Concluído')).toBeTruthy()
    expect(document.getElementById('go-to-full-case-button')).not.toBeNull()
    expect(document.getElementById('go-to-case-checklist-button')).not.toBeNull()
  })

  it('renders empty state when client has no cases', () => {
    vi.spyOn(drawerHookModule, 'useClientCaseDrawer').mockReturnValue({
      clientCases: [],
      activeCase: undefined,
      selectedCaseId: null,
      setSelectedCaseId: vi.fn(),
      isLoading: false,
      checklistItems: [],
      completionPercentage: 0,
      validatedItemsCount: 0,
      pendingItemsCount: 0,
      totalChecklistItems: 0,
    })

    render(
      <ClientCaseDrawer
        clientId='client-2'
        clientName='Maria Souza'
        open={true}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Nenhum caso cadastrado')).toBeTruthy()
    expect(
      screen.getByText('Este cliente não possui processos ativos vinculados no momento.'),
    ).toBeTruthy()
    expect(document.getElementById('create-new-case-button')).not.toBeNull()
  })

  it('renders case selector when client has multiple cases', () => {
    vi.spyOn(drawerHookModule, 'useClientCaseDrawer').mockReturnValue({
      clientCases: [
        {
          id: 'case-1',
          publicCode: 'CASO-001',
          title: 'Aposentadoria',
          clientName: 'Antônio',
          legalArea: 'Previdenciário',
          status: 'documentation' as any,
          openedAt: new Date(),
          updatedAt: new Date(),
          checklistGate: {},
          dossierGate: {},
          team: [],
        },
        {
          id: 'case-2',
          publicCode: 'CASO-002',
          title: 'Revisão',
          clientName: 'Antônio',
          legalArea: 'Previdenciário',
          status: 'documentation' as any,
          openedAt: new Date(),
          updatedAt: new Date(),
          checklistGate: {},
          dossierGate: {},
          team: [],
        },
      ],
      activeCase: {
        id: 'case-1',
        publicCode: 'CASO-001',
        title: 'Aposentadoria',
        clientName: 'Antônio',
        legalArea: 'Previdenciário',
        status: 'documentation' as any,
        openedAt: new Date(),
        updatedAt: new Date(),
        checklistGate: {},
        dossierGate: {},
        team: [],
      },
      selectedCaseId: 'case-1',
      setSelectedCaseId: vi.fn(),
      isLoading: false,
      checklistItems: [],
      completionPercentage: 50,
      validatedItemsCount: 1,
      pendingItemsCount: 1,
      totalChecklistItems: 2,
    })

    render(
      <ClientCaseDrawer
        clientId='client-1'
        clientName='Antônio'
        open={true}
        onOpenChange={vi.fn()}
      />,
    )

    expect(document.getElementById('client-case-selector')).not.toBeNull()
    expect(screen.getAllByText('CASO-001').length).toBeGreaterThan(0)
    expect(screen.getByText('CASO-002')).toBeTruthy()
  })
})
