import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CasoDetalheChecklistPage } from '..'
import { useMyCasePage } from '../use-my-case-page'

vi.mock('../use-my-case-page', () => ({ useMyCasePage: vi.fn() }))
vi.mock('../checklist-dossier-tab', () => ({
  ChecklistDossierTab: () => <div>Conteúdo do checklist</div>,
}))
vi.mock('../overview-tab', () => ({ OverviewTab: () => <div>Visão geral do Caso</div> }))
vi.mock('../portal-access-dialog', () => ({ PortalAccessDialog: () => null }))
vi.mock('@/ui/case-management/widgets/components/case-team', () => ({
  CaseTeam: () => <div>Equipe</div>,
}))

const pageState = vi.mocked(useMyCasePage)

describe('CasoDetalheChecklistPage', () => {
  beforeEach(() => {
    pageState.mockReturnValue({
      activeTab: 'visao-geral',
      caseClientName: 'Cliente Restrito',
      caseLegalArea: 'Previdenciário',
      caseTitle: 'Caso jurídico restrito',
      caseUuid: 'case-1',
      canViewCaseStatus: false,
      canViewIntakeStatus: false,
      canUpload: false,
      caseDetails: {
        id: 'case-1',
        title: 'Caso jurídico restrito',
        publicCode: 'CASO-1',
        status: 'documentation',
        clientName: 'Cliente Restrito',
        legalArea: 'Previdenciário',
        team: [],
      } as never,
      caseTeam: { publicCode: 'CASO-1', status: 'documentation', members: [] },
      isLoadingCaseTeam: false,
      checklistItems: [],
      completionPercentage: 0,
      displayCaseId: 'CASO-1',
      mandatoryItemsCount: 0,
      pendingItemsCount: 0,
      validatedItemsCount: 0,
      handleOpenChecklistTab: vi.fn(),
      handleClosePortalAccessDialog: vi.fn(),
      handleCopyPortalLink: vi.fn(),
      handleGeneratePortalLink: vi.fn(),
      isGeneratingPortalLink: false,
      portalAccessExpiresAt: null,
      portalAccessUrl: null,
      selectedThirdPartyId: '',
      setCanViewCaseStatus: vi.fn(),
      setCanViewIntakeStatus: vi.fn(),
      setCanUpload: vi.fn(),
      setSelectedThirdPartyId: vi.fn(),
      thirdParties: [],
      setActiveTab: vi.fn(),
    } as never)
  })

  it('renders all existing case tabs and read panels for an administrator', () => {
    render(<CasoDetalheChecklistPage caseId='case-1' isAdministrator />)
    expect(screen.getByText('CASO-1')).toBeTruthy()
    expect(screen.getByText(/Status:/).textContent).toBe('Status: documentation')
    expect(screen.getByRole('tab', { name: 'Visão Geral' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Checklist & Dossiê/ })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Prazos & Tarefas' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Equipe' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Peças' }).hasAttribute('disabled')).toBe(
      false,
    )
    expect(screen.queryByRole('tab', { name: 'Andamentos' })).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Comunicações' })).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Encerramento' })).toBeNull()
    expect(screen.getByText('Visão geral do Caso')).toBeTruthy()
  })
})
