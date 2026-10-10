import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCaseTeamRoster } from '@/ui/case-management/widgets/components/case-team-roster/use-case-team-roster'
import { CasoDetalheChecklistPage } from '..'
import { useMyCasePage } from '../use-my-case-page'

vi.mock('../use-my-case-page', () => ({ useMyCasePage: vi.fn() }))
vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(() => ({ currentCollaborator: null })),
}))
vi.mock('../case-page-data', () => ({
  CASE_STAGES: [],
  CASE_TASKS: [],
  CASE_TIMELINE: [],
  MOCK_ACTIVITIES: [],
  getCaseStages: () => [],
}))
vi.mock('../checklist-dossier-tab', () => ({ ChecklistDossierTab: () => null }))
vi.mock('../case-pieces-tab', () => ({ CasePiecesTab: () => null }))
vi.mock('../overview-tab', () => ({ OverviewTab: () => null }))
vi.mock('../portal-access-dialog', () => ({ PortalAccessDialog: () => null }))
vi.mock('../tasks-deadlines-tab', () => ({ TasksDeadlinesTab: () => null }))
vi.mock(
  '@/ui/case-management/widgets/components/case-team-roster/use-case-team-roster',
  () => ({ useCaseTeamRoster: vi.fn() }),
)

const useMyCasePageMock = vi.mocked(useMyCasePage)
const useCaseTeamRosterMock = vi.mocked(useCaseTeamRoster)

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  useMyCasePageMock.mockImplementation(() => {
    const [activeTab, setActiveTab] = useState('visao-geral')
    return {
      activeTab,
      caseClientName: 'Cliente HMS',
      caseLegalArea: 'Direito previdenciário',
      caseTitle: 'Caso de teste',
      caseUuid: 'case-1',
      canViewCaseStatus: false,
      canViewIntakeStatus: false,
      canUpload: false,
      caseDetails: undefined,
      checklistItems: [],
      completionPercentage: 0,
      displayCaseId: 'HMS-001',
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
      setActiveTab,
    } as never
  })
  useCaseTeamRosterMock.mockReturnValue({
    caseTeam: null,
    error: null,
    handleRetry: vi.fn(),
    isLoading: false,
    members: [],
    total: 0,
  })
})

describe('case team tab', () => {
  it('opens the read-only roster from the legal case detail', async () => {
    render(<CasoDetalheChecklistPage caseId='case-1' />)

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Equipe' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(await screen.findByRole('heading', { name: 'Equipe do caso' })).toBeDefined()
    expect(useCaseTeamRosterMock).toHaveBeenCalledWith('case-1')
    expect(
      screen.queryByRole('button', { name: /adicionar|remover|alterar/i }),
    ).toBeNull()
  })
})
