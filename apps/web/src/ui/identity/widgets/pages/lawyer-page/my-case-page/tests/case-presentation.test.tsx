import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { LegalCaseSummary } from '@hms/core/case-management/domain/entities'
import { AdministratorCaseHeader } from '../administrator-case-header'
import { CasePageHeader } from '../case-page-header'
import { CaseTabNavigation } from '../case-tab-navigation'
import { CaseTabPanels } from '../case-tab-panels'
import { LawyerCaseHeader } from '../lawyer-case-header'
import { LawyerCaseHeaderActions } from '../lawyer-case-header-actions'
import { MyCasePortalAccess } from '../my-case-portal-access'
import { ChecklistDocumentList } from '../overview-tab/checklist-document-list'
import { ChecklistProgressCard } from '../overview-tab/checklist-progress-card'
import { OverviewTab } from '../overview-tab'
import { TeamCard } from '../overview-tab/team-card'
import { TimelineCard } from '../overview-tab/timeline-card'
import type { ChecklistItem } from '../types'
import { Tabs } from '@/ui/shadcn/tabs'

afterEach(cleanup)

vi.mock('../checklist-dossier-tab', () => ({
  ChecklistDossierTab: ({ readOnly }: { readOnly: boolean }) => (
    <div>{readOnly ? 'Checklist somente leitura' : 'Checklist editável'}</div>
  ),
}))
vi.mock('../tasks-deadlines-tab', () => ({
  TasksDeadlinesTab: ({ readOnly }: { readOnly: boolean }) => (
    <div>Prazos {String(readOnly)}</div>
  ),
}))
vi.mock('../overview-tab/use-overview-tab', () => ({
  useOverviewTab: () => ({
    documentPendings: [],
    documentPendingsError: null,
    isLoadingDocumentPendings: false,
    caseTasksError: null,
    isLoadingCaseTasks: false,
    priorityItems: [],
    handleOpenChecklistItem: vi.fn(),
  }),
}))
vi.mock('../case-pieces-tab', () => ({
  CasePiecesTab: ({ readOnly }: { readOnly: boolean }) => (
    <div>Peças {String(readOnly)}</div>
  ),
}))
vi.mock('@/ui/case-management/widgets/components/case-team-roster', () => ({
  CaseTeamRoster: ({ caseId }: { caseId: string }) => <div>Equipe {caseId}</div>,
}))
vi.mock('../portal-access-dialog', () => ({
  PortalAccessDialog: ({
    onOpenChange,
    open,
  }: {
    onOpenChange: (open: boolean) => void
    open: boolean
  }) => (
    <div>
      <span data-testid='portal-dialog-open'>{String(open)}</span>
      <button type='button' onClick={() => onOpenChange(true)}>
        Abrir portal
      </button>
      <button type='button' onClick={() => onOpenChange(false)}>
        Fechar portal
      </button>
    </div>
  ),
}))

const checklist: ChecklistItem[] = [
  {
    id: 'validated',
    title: 'Documento validado',
    status: 'validado',
    documentFileId: 'file-1',
  },
  {
    id: 'requested',
    title: 'Documento solicitado',
    status: 'solicitado',
    documentFileId: 'file-2',
  },
  {
    id: 'missing',
    title: 'Documento pendente',
    status: 'nao_solicitado',
  },
  {
    id: 'custom',
    title: 'Documento com estado informado',
    status: 'solicitado',
    statusLabel: 'Em análise',
    documentFileId: 'file-3',
  },
]

const legalCase = {
  id: 'case-1',
  title: 'Caso de teste',
  publicCode: 'CASO-2026-0001',
  status: 'documentation',
  clientName: 'Cliente Exemplo',
  legalArea: 'Cível',
  team: [
    {
      collaboratorId: 'member-1',
      name: 'Beatriz Oliveira',
      role: CaseMemberRole.Manager,
    },
  ],
} as unknown as LegalCaseSummary

const casePageState = {
  caseDetails: legalCase,
  caseTitle: 'Caso de teste',
  displayCaseId: 'CASO-2026-0001',
  caseLegalArea: 'Cível',
  caseClientName: 'Cliente Exemplo',
  isLoadingCase: false,
  isGeneratingPortalLink: false,
} as never

describe('Case detail presentation widgets', () => {
  it('covers checklist status labels, variants, file badges, and the empty state', () => {
    const { rerender } = render(<ChecklistDocumentList items={checklist} />)

    expect(screen.getByText('Validado')).toBeTruthy()
    expect(screen.getByText('Solicitado')).toBeTruthy()
    expect(screen.getByText('Em análise')).toBeTruthy()
    expect(screen.queryByText('Não solicitado')).toBeNull()

    rerender(<ChecklistDocumentList items={[]} />)
    expect(
      screen.getByText(
        'Nenhum item de checklist documental foi encontrado para este caso.',
      ),
    ).toBeTruthy()
  })

  it('covers checklist progress states and opens the full checklist', () => {
    const onOpenChecklist = vi.fn()
    const { rerender } = render(
      <ChecklistProgressCard
        items={checklist}
        completionPercentage={0}
        mandatoryItemsCount={0}
        pendingItemsCount={0}
        validatedItemsCount={0}
        onOpenChecklist={onOpenChecklist}
      />,
    )
    expect(screen.getByText('Checklist não instanciado')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Abrir checklist completo/ }))

    rerender(
      <ChecklistProgressCard
        items={checklist}
        completionPercentage={100}
        mandatoryItemsCount={2}
        pendingItemsCount={0}
        validatedItemsCount={2}
        onOpenChecklist={onOpenChecklist}
      />,
    )
    expect(screen.getByText('Completo para validação')).toBeTruthy()

    rerender(
      <ChecklistProgressCard
        items={checklist}
        completionPercentage={50}
        mandatoryItemsCount={2}
        pendingItemsCount={1}
        validatedItemsCount={1}
        onOpenChecklist={onOpenChecklist}
      />,
    )
    expect(screen.getByText('Recebimento parcial')).toBeTruthy()
    expect(onOpenChecklist).toHaveBeenCalledOnce()
  })

  it('covers the overview next-action branches', () => {
    const onOpenChecklist = vi.fn()
    const props = {
      checklist,
      completionPercentage: 50,
      mandatoryItemsCount: 2,
      pendingItemsCount: 2,
      team: [],
      timeline: [],
      validatedItemsCount: 1,
      onOpenChecklist,
    }

    const { rerender } = render(<OverviewTab {...props} />)
    expect(
      screen.getByText('Próxima ação: completar a documentação do caso'),
    ).toBeTruthy()
    expect(screen.getByText(/2 documentos obrigatórios/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir checklist' }))

    rerender(<OverviewTab {...props} pendingItemsCount={1} />)
    expect(
      screen.getByText(
        '1 documento obrigatório ainda depende de recebimento ou validação.',
      ),
    ).toBeTruthy()

    rerender(<OverviewTab {...props} pendingItemsCount={0} />)
    expect(screen.getByText('Próxima ação: revisar o checklist final')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Revisar checklist' })).toBeTruthy()

    rerender(
      <OverviewTab
        {...props}
        mandatoryItemsCount={0}
        pendingItemsCount={0}
        checklist={[]}
      />,
    )
    expect(
      screen.getByText('Próxima ação: instanciar o checklist documental'),
    ).toBeTruthy()
    expect(
      screen.getByText('Nenhum item de checklist foi encontrado para este caso.'),
    ).toBeTruthy()
    expect(onOpenChecklist).toHaveBeenCalledOnce()
  })

  it('renders team roles, timeline entries, and empty lists', () => {
    const { rerender } = render(
      <TeamCard
        team={[
          {
            collaboratorId: 'manager',
            name: 'Beatriz Oliveira',
            role: CaseMemberRole.Manager,
          },
          {
            collaboratorId: 'collaborator',
            name: 'João Pedro',
            role: CaseMemberRole.Collaborator,
          },
        ]}
      />,
    )
    expect(screen.getByText('Gestor')).toBeTruthy()
    expect(screen.getByText('Colaborador')).toBeTruthy()
    expect(screen.getByText('Beatriz Oliveira')).toBeTruthy()

    rerender(<TeamCard team={[]} />)
    expect(screen.getByRole('heading', { name: 'Equipe do Caso' })).toBeTruthy()

    rerender(
      <TimelineCard
        timeline={[
          { icon: 'check', title: 'Documento recebido', description: 'Hoje às 10h' },
        ]}
      />,
    )
    expect(screen.getByText('Documento recebido')).toBeTruthy()
    rerender(<TimelineCard timeline={[]} />)
    expect(screen.getByRole('heading', { name: 'Linha do Tempo' })).toBeTruthy()
  })

  it('covers administrator header loading, unavailable, and populated states', () => {
    const { rerender } = render(
      <AdministratorCaseHeader isLoading caseDetails={undefined} />,
    )
    expect(screen.getByRole('heading', { name: 'Carregando caso…' })).toBeTruthy()
    rerender(<AdministratorCaseHeader isLoading={false} caseDetails={undefined} />)
    expect(screen.getByRole('heading', { name: 'Detalhes indisponíveis' })).toBeTruthy()
    rerender(<AdministratorCaseHeader isLoading={false} caseDetails={legalCase} />)
    expect(screen.getByRole('heading', { name: 'Caso de teste' })).toBeTruthy()
    expect(screen.getByText('CASO-2026-0001')).toBeTruthy()
    expect(screen.getByText('Status: documentation')).toBeTruthy()
    expect(screen.getByLabelText('Equipe do caso')).toBeTruthy()
  })

  it('renders lawyer header facts, stages, avatars, and action states', () => {
    const onOpenPortal = vi.fn()
    render(
      <LawyerCaseHeader
        title='Caso de teste'
        publicCode='CASO-2026-0001'
        legalArea='Cível'
        clientName='Cliente Exemplo'
        team={[{ collaboratorId: 'member-1', name: 'Beatriz Oliveira' }]}
        isGeneratingPortalLink={false}
        dossierApproved={false}
        onOpenPortal={onOpenPortal}
        onOpenNewPiece={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Caso de teste' })).toBeTruthy()
    expect(screen.getByText('Prioridade: Normal')).toBeTruthy()
    expect(screen.getByText('Cível')).toBeTruthy()
    expect(screen.getAllByText('Documentação').length).toBeGreaterThan(0)
    expect(screen.getByText('Produção Jurídica')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Gerar link para terceiro' }))
    expect(onOpenPortal).toHaveBeenCalledOnce()

    const { rerender } = render(
      <LawyerCaseHeaderActions
        isGeneratingPortalLink
        onOpenPortal={onOpenPortal}
        dossierApproved={false}
        onOpenNewPiece={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Gerando link...' }).hasAttribute('disabled'),
    ).toBe(true)
    rerender(
      <LawyerCaseHeaderActions
        isGeneratingPortalLink={false}
        dossierApproved={false}
        onOpenPortal={onOpenPortal}
        onOpenNewPiece={vi.fn()}
      />,
    )
    expect(
      screen
        .getAllByRole('button', { name: 'Gerar link para terceiro' })[0]
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('covers case header selection and summary fields', () => {
    const onOpenPortal = vi.fn()
    const { rerender } = render(
      <CasePageHeader
        isAdministrator
        state={casePageState}
        onOpenPortal={onOpenPortal}
        onOpenNewPiece={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Caso de teste' })).toBeTruthy()
    rerender(
      <CasePageHeader
        isAdministrator={false}
        state={casePageState}
        onOpenPortal={onOpenPortal}
        onOpenNewPiece={vi.fn()}
      />,
    )
    expect(screen.getByText('CASO-2026-0001')).toBeTruthy()
    expect(screen.getByText('Cliente Exemplo')).toBeTruthy()
    expect(screen.getByText('Equipe do caso')).toBeTruthy()
    expect(onOpenPortal).not.toHaveBeenCalled()

    rerender(
      <CasePageHeader
        isAdministrator={false}
        state={
          {
            caseDetails: undefined,
            caseTitle: 'Caso de teste',
            displayCaseId: 'CASO-2026-0001',
            caseLegalArea: 'Cível',
            caseClientName: 'Cliente Exemplo',
            isLoadingCase: false,
            isGeneratingPortalLink: false,
          } as never
        }
        onOpenPortal={onOpenPortal}
        onOpenNewPiece={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Caso de teste' })).toBeTruthy()
  })

  it('renders navigation count and locked tab', () => {
    render(
      <Tabs defaultValue='visao-geral'>
        <CaseTabNavigation pendingItemsCount={3} dossierApproved={false} />
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: /Checklist & Dossiê/ }).textContent).toContain(
      '3',
    )
    expect(screen.getByRole('tab', { name: 'Peças' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('tab', { name: 'Equipe' })).toBeTruthy()
  })

  it('renders all supported administrator panels without granting editing', () => {
    const props = {
      isAdministrator: true,
      caseUuid: 'case-1',
      caseDetails: legalCase,
      checklistItems: checklist,
      completionPercentage: 50,
      mandatoryItemsCount: 2,
      pendingItemsCount: 1,
      validatedItemsCount: 1,
      onOpenChecklist: vi.fn(),
      openNewPieceDialog: false,
      onNewPieceDialogOpenChange: vi.fn(),
    }
    const { rerender } = render(
      <Tabs value='visao-geral'>
        <CaseTabPanels {...props} />
      </Tabs>,
    )
    expect(screen.getByText('Beatriz Oliveira')).toBeTruthy()
    for (const [tab, content] of [
      ['checklist', 'Checklist somente leitura'],
      ['prazos', 'Prazos true'],
      ['pecas', 'Peças true'],
      ['equipe', 'Equipe case-1'],
    ]) {
      rerender(
        <Tabs value={tab}>
          <CaseTabPanels {...props} />
        </Tabs>,
      )
      expect(screen.getByText(content)).toBeTruthy()
    }
    rerender(
      <Tabs value='checklist'>
        <CaseTabPanels {...props} isAdministrator={false} />
      </Tabs>,
    )
    expect(screen.getByText('Checklist editável')).toBeTruthy()
  })

  it('closes portal access and clears the selected third party', () => {
    const handleClosePortalAccessDialog = vi.fn()
    const setSelectedThirdPartyId = vi.fn()
    const setIsPickerOpen = vi.fn()
    const state = {
      portalAccessExpiresAt: null,
      canViewCaseStatus: false,
      canViewIntakeStatus: false,
      canUpload: false,
      isGeneratingPortalLink: false,
      handleGeneratePortalLink: vi.fn(),
      handleCopyPortalLink: vi.fn(),
      handleClosePortalAccessDialog,
      selectedThirdPartyId: 'third-party-1',
      setCanViewCaseStatus: vi.fn(),
      setCanViewIntakeStatus: vi.fn(),
      setCanUpload: vi.fn(),
      setSelectedThirdPartyId,
      thirdParties: [],
      portalAccessUrl: null,
    }

    const { rerender } = render(
      <MyCasePortalAccess
        state={state as never}
        isPickerOpen
        setIsPickerOpen={setIsPickerOpen}
      />,
    )
    expect(screen.getByTestId('portal-dialog-open').textContent).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir portal' }))
    expect(setIsPickerOpen).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar portal' }))
    expect(setIsPickerOpen).toHaveBeenCalledWith(false)
    expect(handleClosePortalAccessDialog).toHaveBeenCalledOnce()
    expect(setSelectedThirdPartyId).toHaveBeenCalledWith('')

    rerender(
      <MyCasePortalAccess
        state={{ ...state, portalAccessUrl: 'https://portal.test' } as never}
        isPickerOpen={false}
        setIsPickerOpen={setIsPickerOpen}
      />,
    )
    expect(screen.getByTestId('portal-dialog-open').textContent).toBe('true')
    rerender(
      <MyCasePortalAccess
        state={{ ...state, portalAccessUrl: null } as never}
        isPickerOpen={false}
        setIsPickerOpen={setIsPickerOpen}
      />,
    )
    expect(screen.getByTestId('portal-dialog-open').textContent).toBe('false')
  })
})
