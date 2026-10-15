import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
vi.mock('@/ui/case-management/widgets/components/case-team-roster', () => ({
  CaseTeamRoster: ({ caseId }: { caseId: string }) => (
    <section>
      <h2>Equipe do caso</h2>
      <p>{caseId}</p>
    </section>
  ),
}))

const useMyCasePageMock = vi.mocked(useMyCasePage)

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
})

describe('CasoDetalheChecklistPage team tab', () => {
  it('opens the roster for the current case', async () => {
    render(<CasoDetalheChecklistPage caseId='case-1' />)

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Equipe' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(await screen.findByRole('heading', { name: 'Equipe do caso' })).toBeDefined()
    expect(screen.getByText('case-1')).toBeDefined()
    expect(
      screen.queryByRole('button', { name: /adicionar|remover|alterar/i }),
    ).toBeNull()
  })
})
