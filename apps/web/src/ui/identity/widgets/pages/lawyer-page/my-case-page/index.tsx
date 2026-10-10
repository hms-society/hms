import { Icon } from '@/ui/shared/widgets/components/icon'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { CaseTeamRoster } from '@/ui/case-management/widgets/components/case-team-roster'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { useState } from 'react'

import { CASE_TIMELINE, getCaseStages } from './case-page-data'
import { ChecklistDossierTab } from './checklist-dossier-tab'
import { CasePiecesTab } from './case-pieces-tab'
import { OverviewTab } from './overview-tab'
import { PortalAccessDialog } from './portal-access-dialog'
import { TasksDeadlinesTab } from './tasks-deadlines-tab'
import { useMyCasePage } from './use-my-case-page'

export type CasoDetalheChecklistPageProps = {
  caseId?: string
}

export const CasoDetalheChecklistPage = ({ caseId }: CasoDetalheChecklistPageProps) => {
  const [isPortalPickerOpen, setIsPortalPickerOpen] = useState(false)
  const [isNewPieceDialogOpen, setIsNewPieceDialogOpen] = useState(false)
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const {
    activeTab,
    caseClientName,
    caseLegalArea,
    caseTitle,
    caseUuid,
    canViewCaseStatus,
    canViewIntakeStatus,
    canUpload,
    caseDetails,
    checklistItems,
    completionPercentage,
    displayCaseId,
    mandatoryItemsCount,
    pendingItemsCount,
    validatedItemsCount,
    handleOpenChecklistTab,
    handleClosePortalAccessDialog,
    handleCopyPortalLink,
    handleGeneratePortalLink,
    isGeneratingPortalLink,
    portalAccessExpiresAt,
    portalAccessUrl,
    selectedThirdPartyId,
    setCanViewCaseStatus,
    setCanViewIntakeStatus,
    setCanUpload,
    setSelectedThirdPartyId,
    thirdParties,
    setActiveTab,
  } = useMyCasePage({ caseId })
  const dossierApproved = Boolean(caseDetails?.dossierGate.homologatedAt)
  const caseStages = getCaseStages(caseDetails?.status)

  return (
    <div className='flex w-full flex-col gap-5 pb-10 font-sans mt-5'>
      <section className='rounded-lg border border-border bg-secondary px-5 py-4 shadow-xs'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='font-serif text-2xl font-semibold text-foreground'>
                {caseTitle}
              </h1>
              <Badge variant='attention' className='h-6 rounded-full px-3 text-[12px]'>
                <span className='size-1.5 rounded-full bg-brand-accent' />
                Documentação em formação
              </Badge>
            </div>

            <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted-foreground'>
              <span className='flex items-center gap-1.5'>
                <Icon name='tag' className='size-3.5' />
                {displayCaseId}
              </span>
              <span className='flex items-center gap-1.5'>
                <Icon name='scale' className='size-3.5' />
                {caseLegalArea}
              </span>
              <span className='flex items-center gap-1.5'>
                <Icon name='user' className='size-3.5' />
                {caseClientName}
              </span>
              <span className='flex items-center gap-1.5'>
                <Icon name='alert-circle' className='size-3.5' />
                Prioridade: Normal
              </span>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-end gap-2'>
            <div className='mr-1 flex items-center'>
              <div className='flex -space-x-1.5'>
                {caseDetails?.team?.map((member) => (
                  <Avatar
                    key={member.collaboratorId}
                    className='size-8 border-2 border-secondary'
                  >
                    <AvatarFallback className='bg-teal-700 text-white text-[12px]'>
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className='ml-3 text-[14px] font-medium text-muted-foreground'>
                Equipe do caso
              </span>
            </div>
            <Button
              variant='outline'
              size='xs'
              className='rounded-full bg-accent text-accent-foreground'
            >
              <Icon name='plus' className='size-3' />
              Nova tarefa
            </Button>
            <Button
              variant='outline'
              size='xs'
              className='rounded-full border-primary bg-background text-primary hover:bg-primary/10'
              disabled={isGeneratingPortalLink}
              onClick={() => setIsPortalPickerOpen(true)}
            >
              <Icon name='link' className='size-3' />
              {isGeneratingPortalLink ? 'Gerando link...' : 'Gerar link para terceiro'}
            </Button>
            <Button
              size='xs'
              className='rounded-full'
              disabled={!dossierApproved}
              onClick={() => {
                setActiveTab('pecas')
                setIsNewPieceDialogOpen(true)
              }}
            >
              <Icon name='plus' className='size-3' />
              Nova peça
            </Button>
          </div>
        </div>

        <div className='mt-5 flex w-full flex-wrap items-center gap-x-5 gap-y-3 overflow-hidden border-t border-border pt-4'>
          {caseStages.map((stage, index) => {
            const isCompleted = stage.status === 'Concluída'

            return (
              <div key={stage.label} className='flex min-w-fit items-center'>
                <div
                  className={`flex items-center gap-2 text-[14px] font-semibold ${
                    stage.isActive
                      ? 'text-primary'
                      : isCompleted
                        ? 'text-badge-success-foreground'
                        : 'text-muted-foreground opacity-60'
                  }`}
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-full ${
                      stage.isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'bg-badge-success text-badge-success-foreground'
                          : 'border border-border bg-background'
                    }`}
                  >
                    <Icon name={stage.icon} className='size-3.5' />
                  </div>
                  <span className='flex flex-col'>
                    {stage.label}
                    {stage.status && (
                      <span
                        className={`text-[14px] font-normal ${
                          isCompleted
                            ? 'text-badge-success-foreground'
                            : 'text-primary/70'
                        }`}
                      >
                        {stage.status}
                      </span>
                    )}
                  </span>
                </div>
                {index < caseStages.length - 1 && (
                  <div className='mx-2 hidden h-px w-10 bg-border lg:block' />
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList
          variant='line'
          className='grid w-full grid-cols-2 items-center gap-x-0 gap-y-1 text-[14px] sm:grid-cols-4 xl:grid-cols-8'
        >
          <TabsTrigger
            value='visao-geral'
            className='w-full justify-center py-3 text-[13px]'
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value='equipe' className='w-full justify-center py-3 text-[13px]'>
            Equipe
          </TabsTrigger>
          <TabsTrigger
            value='checklist'
            className='w-full justify-center gap-2 py-3 text-[13px]'
          >
            Checklist & Dossiê
            <Badge variant='secondary' className='h-5 rounded-full px-1.5 text-[12px]'>
              {pendingItemsCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value='pecas'
            className='w-full justify-center py-3 text-[13px]'
            disabled={!dossierApproved}
          >
            {!dossierApproved ? <Icon name='lock' className='size-3.5' /> : null}
            Peças
          </TabsTrigger>
          <TabsTrigger value='prazos' className='w-full justify-center py-3 text-[13px]'>
            Prazos & Tarefas
          </TabsTrigger>
          <TabsTrigger
            value='andamentos'
            className='w-full justify-center py-3 text-[13px]'
          >
            Andamentos
          </TabsTrigger>
          <TabsTrigger
            value='comunicacoes'
            className='w-full justify-center py-3 text-[13px]'
          >
            Comunicações
          </TabsTrigger>
          <TabsTrigger
            value='encerramento'
            className='w-full justify-center py-3 text-[13px]'
          >
            Encerramento
          </TabsTrigger>
        </TabsList>

        <TabsContent value='visao-geral' className='mt-4 flex flex-col gap-4'>
          <OverviewTab
            caseId={caseUuid}
            checklist={checklistItems}
            completionPercentage={completionPercentage}
            mandatoryItemsCount={mandatoryItemsCount}
            pendingItemsCount={pendingItemsCount}
            currentCollaboratorId={currentCollaborator?.collaboratorId}
            team={
              caseDetails?.team?.map((member) => ({
                collaboratorId: member.collaboratorId,
                name: member.name,
                role: member.role,
                initials: member.name.substring(0, 2).toUpperCase(),
                className: 'bg-primary text-primary-foreground',
              })) ?? []
            }
            timeline={CASE_TIMELINE}
            validatedItemsCount={validatedItemsCount}
            onOpenChecklist={handleOpenChecklistTab}
            onOpenTasks={() => setActiveTab('prazos')}
          />
        </TabsContent>

        <TabsContent value='checklist' className='mt-4 flex flex-col gap-4'>
          <ChecklistDossierTab
            caseId={caseUuid}
            caseDetails={caseDetails}
            checklist={checklistItems}
          />
        </TabsContent>

        <TabsContent value='equipe' className='mt-4 flex flex-col gap-4'>
          <CaseTeamRoster caseId={caseUuid} />
        </TabsContent>

        <TabsContent value='prazos' className='mt-4 flex flex-col gap-4'>
          <TasksDeadlinesTab
            caseId={caseUuid}
            caseIdentifier={displayCaseId}
            caseTitle={caseTitle}
            team={caseDetails?.team ?? []}
          />
        </TabsContent>
        <TabsContent value='pecas' className='mt-4 flex flex-col gap-4'>
          <CasePiecesTab
            dossierApproved={dossierApproved}
            caseId={caseUuid}
            openNewPieceDialog={isNewPieceDialogOpen}
          />
        </TabsContent>
      </Tabs>

      <PortalAccessDialog
        expiresAt={portalAccessExpiresAt}
        canViewCaseStatus={canViewCaseStatus}
        canViewIntakeStatus={canViewIntakeStatus}
        canUpload={canUpload}
        isGenerating={isGeneratingPortalLink}
        onGenerate={handleGeneratePortalLink}
        onCopy={handleCopyPortalLink}
        onOpenChange={(open) => {
          setIsPortalPickerOpen(open)
          if (!open) {
            handleClosePortalAccessDialog()
            setSelectedThirdPartyId('')
          }
        }}
        open={Boolean(portalAccessUrl) || isPortalPickerOpen}
        selectedThirdPartyId={selectedThirdPartyId}
        onCanViewCaseStatusChange={setCanViewCaseStatus}
        onCanViewIntakeStatusChange={setCanViewIntakeStatus}
        onCanUploadChange={setCanUpload}
        onThirdPartyChange={setSelectedThirdPartyId}
        thirdParties={thirdParties}
        url={portalAccessUrl}
      />
    </div>
  )
}
