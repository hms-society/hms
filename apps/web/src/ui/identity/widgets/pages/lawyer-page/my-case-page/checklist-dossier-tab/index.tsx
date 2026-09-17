import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ui/shadcn/dialog'

import {
  getChecklistActionIcon,
  getChecklistActionLabel,
  getChecklistIcon,
  getChecklistIconClasses,
  getChecklistRowClasses,
} from '../checklist-style'
import type { ActivityItem, ChecklistItem } from '../types'
import { isPast, format } from 'date-fns'
import { useState } from 'react'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'

import { DecisionReasonDialog } from './decision-reason-dialog'
import { useChecklistDossierTab } from './use-checklist-dossier-tab'
import { RequestDocumentExceptionModal } from '@/ui/document-engine/widgets/pages/document-analysis-page/request-document-exception-modal'
import { RejectDocumentExceptionModal } from '@/ui/document-engine/widgets/pages/document-analysis-page/reject-document-exception-modal'
import { useListCaseDocumentExceptionsQuery } from '@/ui/document-engine/hooks/use-list-case-document-exceptions-query'
import { useApproveDocumentExceptionAction } from '@/ui/document-engine/hooks/use-approve-document-exception-action'
import { useRejectDocumentExceptionAction } from '@/ui/document-engine/hooks/use-reject-document-exception-action'

export type ChecklistDossierTabProps = {
  activities: ActivityItem[]
  caseId: string
  checklist: ChecklistItem[]
  isReviewDisabled?: boolean
  reviewDisabledReason?: string
}

export const ChecklistDossierTab = ({
  activities,
  caseId,
  checklist,
  isReviewDisabled = false,
  reviewDisabledReason,
}: ChecklistDossierTabProps) => {
  const {
    actionFeedback,
    canStartLegalWriting,
    checklistGateAuditLabel,
    checklistGateLabel,
    checklistGateRemarks,
    checklistItems,
    complementaryItems,
    decisionReasonDialog,
    dossierGateLabel,
    error,
    handleApproveChecklist,
    handleApproveWithException,
    handleBlockChecklist,
    handleCancelDecisionReason,
    handleConfirmDecisionReason,
    handleDecisionReasonDialogOpenChange,
    handleAddComplementaryItem,
    handleFilterByCase,
    handleOpenChecklistItemDetail,
    handleOpenValidationDesk,
    handleRejectOnMerit,
    handleRemarksChange,
    handleRequestDocumentException,
    handleValidateChecklistItem,
    isDecisionReasonDialogOpen,
    isChecklistComplete,
    isExceptionModalOpen,
    isRequestingException,
    isReviewDisabled: isChecklistReviewDisabled,
    isReviewingChecklistGate,
    mandatoryItemsCount,
    pendingItemsCount,
    reasonError,
    remarks,
    requestException,
    setIsExceptionModalOpen,
    validatedItemsCount,
  } = useChecklistDossierTab({
    caseId,
    checklist,
    isReviewDisabled,
  })
  
  const { exceptions } = useListCaseDocumentExceptionsQuery(caseId)
  
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const { approveException, isApprovingException } = useApproveDocumentExceptionAction(caseId)
  const { rejectException, isRejectingException } = useRejectDocumentExceptionAction(caseId)
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [exceptionToReject, setExceptionToReject] = useState<string | null>(null)
  const [justificationToView, setJustificationToView] = useState<string | null>(null)
  
  const handleOpenRejectModal = (exceptionId: string) => {
    setExceptionToReject(exceptionId)
    setIsRejectModalOpen(true)
  }

  const handleConfirmReject = async (justification: string) => {
    if (!exceptionToReject) return
    await rejectException({ exceptionId: exceptionToReject, justification })
    setExceptionToReject(null)
  }
  
  const progressPercentage =
    mandatoryItemsCount > 0
      ? Math.round((validatedItemsCount / mandatoryItemsCount) * 100)
      : 0
  const hasChecklistItems = mandatoryItemsCount > 0
  const checklistStatusLabel = isChecklistComplete
    ? 'Completo para validação'
    : hasChecklistItems
      ? 'Recebimento parcial'
      : 'Checklist não instanciado'
  const checklistStatusVariant = isChecklistComplete
    ? 'success'
    : hasChecklistItems
      ? 'attention'
      : 'secondary'
  const checklistOriginLabel = hasChecklistItems
    ? `${mandatoryItemsCount} item(ns) obrigatório(s) carregado(s) do checklist do caso`
    : 'Nenhum checklist documental foi encontrado para este caso'

  return (
    <>
      <div className='flex flex-col justify-between gap-4 rounded-lg border border-accent bg-accent px-4 py-2.5 lg:flex-row lg:items-start'>
        <div className='flex items-start gap-3'>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-accent-foreground'>
            <Icon name='lock' className='size-3.5' />
          </div>
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-[14px] font-semibold text-accent-foreground'>
              Gate de produção jurídica
            </h2>
            <p className='text-[14px] text-accent-foreground/80'>
              Checklist e Dossiê Documental são gates sequenciais. O checklist pode
              avançar com aprovação humana, mas a escrita jurídica segue bloqueada até
              homologação do dossiê.
            </p>
            <div className='mt-1 flex flex-wrap gap-1.5'>
              <Badge variant='attention' className='h-6 rounded-full px-3 text-[12px]'>
                {checklistGateLabel}
              </Badge>
              <Badge variant='secondary' className='h-6 rounded-full px-3 text-[12px]'>
                {dossierGateLabel}
              </Badge>
              {!canStartLegalWriting && (
                <Badge variant='outline' className='h-6 rounded-full px-3 text-[12px]'>
                  Escrita bloqueada
                </Badge>
              )}
            </div>
            {checklistGateRemarks && (
              <p className='mt-1 text-[14px] font-medium text-accent-foreground'>
                Ressalvas: {checklistGateRemarks}
              </p>
            )}
            {checklistGateAuditLabel && (
              <p className='mt-1 text-[14px] font-medium text-accent-foreground'>
                {checklistGateAuditLabel}
              </p>
            )}
            {error && (
              <p className='mt-1 text-[14px] font-medium text-destructive'>
                {error.message}
              </p>
            )}
            {isChecklistReviewDisabled && reviewDisabledReason && (
              <p className='mt-1 text-[14px] font-medium text-accent-foreground'>
                {reviewDisabledReason}
              </p>
            )}
            {actionFeedback && (
              <p className='mt-1 text-[14px] font-medium text-primary'>
                {actionFeedback}
              </p>
            )}
          </div>
        </div>
        <div className='flex flex-wrap justify-end gap-2 lg:max-w-sm'>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-accent bg-background text-accent-foreground hover:bg-secondary'
            disabled={
              !isChecklistComplete ||
              isChecklistReviewDisabled ||
              isReviewingChecklistGate
            }
            onClick={handleApproveChecklist}
          >
            <Icon name='check' className='size-3' />
            Aprovar checklist
          </Button>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-accent bg-background text-accent-foreground hover:bg-secondary'
            disabled={isChecklistReviewDisabled || isReviewingChecklistGate}
            onClick={handleApproveWithException}
          >
            <Icon name='shield-check' className='size-3' />
            Aprovar com exceção
          </Button>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-destructive/20 bg-background text-destructive hover:bg-destructive/10'
            disabled={isChecklistReviewDisabled || isReviewingChecklistGate}
            onClick={handleBlockChecklist}
          >
            <Icon name='lock' className='size-3' />
            Bloqueado/insuficiente
          </Button>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-destructive/20 bg-background text-destructive hover:bg-destructive/10'
            disabled={isChecklistReviewDisabled || isReviewingChecklistGate}
            onClick={handleRejectOnMerit}
          >
            <Icon name='shield-alert' className='size-3' />
            Reprovar mérito
          </Button>
        </div>
      </div>

      <DecisionReasonDialog
        confirmLabel={decisionReasonDialog.confirmLabel}
        description={decisionReasonDialog.description}
        error={reasonError}
        isConfirming={isReviewingChecklistGate}
        open={isDecisionReasonDialogOpen}
        reason={remarks}
        title={decisionReasonDialog.title}
        onCancel={handleCancelDecisionReason}
        onConfirm={handleConfirmDecisionReason}
        onOpenChange={handleDecisionReasonDialogOpenChange}
        onReasonChange={handleRemarksChange}
      />

      <section className='flex flex-col gap-4 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='flex flex-col gap-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='font-serif text-lg font-semibold text-foreground'>
                Checklist Documental
              </h2>
              <Badge
                variant={checklistStatusVariant}
                className='h-6 rounded-full px-3 text-[12px]'
              >
                {checklistStatusLabel}
              </Badge>
            </div>
            <p className='text-[14px] text-muted-foreground'>{checklistOriginLabel}</p>
          </div>

          <div className='flex w-full max-w-56 flex-col items-end gap-1.5'>
            <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className='text-[14px] font-semibold text-foreground'>
              {validatedItemsCount} de {mandatoryItemsCount} obrigatórios -{' '}
              {progressPercentage}%
            </span>
          </div>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='brand'
            size='xs'
            className='h-8 rounded-full bg-background text-[12px]'
            onClick={handleOpenValidationDesk}
          >
            <Icon name='check-circle-2' className='size-3' />
            Mesa de Validação
            <Icon name='arrow-right' className='size-3' />
          </Button>
          <Button
            variant='brand'
            size='xs'
            className='h-8 rounded-full bg-background text-[12px]'
            onClick={handleFilterByCase}
          >
            Filtrado por este caso
            <Icon name='arrow-right' className='size-3' />
          </Button>
        </div>

        <div className='flex flex-col gap-3'>
          <h3 className='text-[12px] font-bold uppercase tracking-wider text-muted-foreground'>
            Itens obrigatórios
          </h3>
          <div className='flex flex-col gap-1.5'>
            {checklistItems.length > 0 ? (
              checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex min-w-0 flex-col gap-3 rounded-md border px-3 py-2 md:flex-row md:items-center md:justify-between ${getChecklistRowClasses(
                    item.status,
                  )}`}
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md ${getChecklistIconClasses(
                        item.status,
                      )}`}
                    >
                      <Icon name={getChecklistIcon(item.status)} className='size-3' />
                    </div>
                    <div className='flex min-w-0 flex-col gap-0.5'>
                      <div className='flex flex-wrap items-center gap-1.5'>
                        <span className='text-[14px] font-semibold text-foreground'>
                          {item.title}
                        </span>
                        {item.status === 'validado' && (
                          <Badge
                            variant='success'
                            className='h-5 rounded-full px-2 text-[12px]'
                          >
                            Validado
                          </Badge>
                        )}
                        {item.status === 'solicitado' && item.documentFileId && (
                          <Badge
                            variant='attention'
                            className='h-5 rounded-full px-2 text-[12px]'
                          >
                            {item.statusLabel ?? 'Aguardando validação'}
                          </Badge>
                        )}
                        {item.status === 'nao_solicitado' && (
                          <Badge
                            variant='secondary'
                            className='h-5 rounded-full px-2 text-[12px]'
                          >
                            Não solicitado
                          </Badge>
                        )}
                        {item.pendencies && (
                          <Badge
                            variant='destructive'
                            className='h-5 rounded-full px-2 text-[12px]'
                          >
                            <Icon name='alert-circle' className='size-3' />
                            {item.pendencies} pendência
                          </Badge>
                        )}
                      </div>
                      <span className='truncate text-[14px] text-muted-foreground'>
                        {item.documentName || item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className='flex shrink-0 items-center gap-2 self-end md:self-center'>
                    {item.documentFileId && (
                      <Button
                        variant='brand'
                        size='xs'
                        className='h-8 rounded-full bg-accent px-3 text-[12px] text-accent-foreground'
                        onClick={() => handleValidateChecklistItem(item.id)}
                      >
                        <Icon
                          name={getChecklistActionIcon(
                            item.status,
                            Boolean(item.documentName),
                          )}
                          className='size-3'
                        />
                        {getChecklistActionLabel(item.status, Boolean(item.documentName))}
                      </Button>
                    )}
                    <Button
                      variant='outline'
                      size='icon-xs'
                      aria-label={`Abrir ${item.title}`}
                      className='size-7 rounded-full bg-background text-muted-foreground'
                      onClick={() => handleOpenChecklistItemDetail(item.id)}
                    >
                      <Icon name='arrow-right' className='size-3' />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className='rounded-md border border-border bg-muted/30 px-3 py-4 text-xs text-muted-foreground'>
                Nenhum item de checklist documental foi encontrado para este caso.
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-col gap-3 border-t border-border pt-3'>
          <h3 className='text-[12px] font-bold uppercase tracking-wider text-muted-foreground'>
            Itens complementares do caso
          </h3>
          <div className='flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3'>
            <div className='flex min-w-0 flex-col gap-1'>
              {complementaryItems.length === 0 ? (
                <span className='text-[14px] text-muted-foreground'>
                  Nenhum item complementar adicionado. Itens complementares são
                  específicos deste caso e exigem justificativa — não alteram o template
                  de origem.
                </span>
              ) : (
                complementaryItems.map((item) => (
                  <span key={item} className='text-[14px] font-medium text-foreground'>
                    {item}
                  </span>
                ))
              )}
            </div>
            <Button
              variant='brand'
              size='xs'
              className='h-8 rounded-full bg-background text-[12px]'
              onClick={handleAddComplementaryItem}
            >
              <Icon name='plus' className='size-3' />
              Adicionar item
            </Button>
          </div>
        </div>
      </section>

      <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
        <div className='flex items-center justify-between gap-4'>
          <h2 className='font-serif text-lg font-semibold text-foreground'>
            Dossiê Documental
          </h2>
          <Badge variant='secondary' className='h-6 rounded-full px-3 text-[12px]'>
            Não iniciado
          </Badge>
        </div>
        <p className='text-[14px] text-muted-foreground'>
          O dossiê é formado automaticamente pelos documentos validados assim que o
          checklist final for aprovado. É a base documental oficial da produção jurídica.
        </p>
        <div className='flex flex-col gap-1.5'>
          {[
            'Checklist aprovado',
            'Dossiê formado e aprovado',
            'Produção jurídica liberada',
          ].map((label, index) => (
            <div
              key={label}
              className='flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-[14px] text-muted-foreground'
            >
              <span className='flex items-center gap-2'>
                <Icon
                  name={
                    index === 0 ? 'list-checks' : index === 1 ? 'file-text' : 'pencil'
                  }
                  className='size-3'
                />
                {label}
              </span>
              <Icon name='lock' className='size-3' />
            </div>
          ))}
        </div>
        {pendingItemsCount > 0 && (
          <p className='text-[14px] text-muted-foreground'>
            {pendingItemsCount} itens ainda exigem validação ou exceção autorizada antes
            do avanço de fase.
          </p>
        )}
      </section>

      <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
        <h2 className='font-serif text-lg font-semibold text-foreground'>
          Exceções Documentais
        </h2>
        {exceptions.length === 0 ? (
          <div className='flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-[14px] text-muted-foreground'>
            <Icon name='shield-check' className='size-3.5 text-primary' />
            Nenhuma exceção ativa neste caso.
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            {exceptions.map((exc) => {
              const doc = checklistItems.find((item) => item.id === exc.documentId)
              const docName = doc ? doc.title : 'Documento não identificado'
              
              let statusLabel = exc.status === 'APPROVED' ? 'Aprovado' : exc.status === 'REJECTED' ? 'Reprovado' : 'Pendente'
              let statusClass = 'text-muted-foreground bg-muted/20'
              
              if (exc.deadlineDate) {
                const isExpired = isPast(new Date(exc.deadlineDate))
                if (isExpired) {
                  statusLabel = 'Expirado'
                  statusClass = 'text-destructive border-destructive/20 bg-destructive/10'
                } else {
                  statusLabel = `No prazo até ${format(new Date(exc.deadlineDate), 'dd/MM/yyyy')}`
                  statusClass = 'text-primary border-primary/20 bg-primary/10'
                }
              }

              return (
                <div 
                  key={exc.id} 
                  className={`flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2.5 text-[14px] ${exc.status === 'REJECTED' && exc.rejectionJustification ? 'cursor-pointer hover:border-red-300 bg-red-50' : 'bg-background'}`}
                  onClick={() => {
                    if (exc.status === 'REJECTED' && exc.rejectionJustification) {
                      setJustificationToView(exc.rejectionJustification)
                    }
                  }}
                >
                  <div className='flex flex-col'>
                    <span className='font-semibold text-foreground'>{docName}</span>
                    <span className='text-xs text-muted-foreground'>
                      {exc.type === 'ACEITE_PROVISORIO' ? 'Aceite provisório' : 'Dispensa definitiva'}
                    </span>
                  </div>
                  <div className='flex items-center gap-3'>
                    {exc.status === 'PENDING' && currentCollaborator?.profile === 'supervisor' && (
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='xs'
                          className='h-7 rounded-full bg-destructive/10 text-destructive font-semibold px-3'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenRejectModal(exc.id)
                          }}
                        >
                          Recusar
                        </Button>
                        <Button
                          variant='ghost'
                          size='xs'
                          className='h-7 rounded-full bg-green-600/10 text-green-700 font-semibold px-3'
                          onClick={(e) => {
                            e.stopPropagation()
                            approveException(exc.id)
                          }}
                          disabled={isApprovingException}
                        >
                          Aprovar
                        </Button>
                      </div>
                    )}
                    <Badge variant='outline' className={statusClass}>{statusLabel}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className='text-[14px] text-muted-foreground'>
          Quando um documento não puder ser obtido, solicite exceção com justificativa. A
          aprovação é de outro perfil autorizado — o solicitante não aprova a própria
          exceção.
        </p>
        <Button
          variant='brand'
          size='xs'
          className='h-9 w-full rounded-full bg-background text-[14px]'
          onClick={handleRequestDocumentException}
        >
          <Icon name='alert-triangle' className='size-3.5' />
          Solicitar exceção documental
        </Button>
      </section>

      <section className='flex flex-col gap-4 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
        <h2 className='font-serif text-lg font-semibold text-foreground'>
          Atividade Documental
        </h2>
        <div className='relative flex flex-col gap-4 before:absolute before:inset-y-1 before:left-3 before:w-px before:bg-border'>
          {activities.map((activity) => (
            <div key={activity.id} className='relative z-10 flex items-start gap-3'>
              <div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background'>
                <Icon name={activity.icon} className='size-3 text-muted-foreground' />
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-[14px] font-semibold text-foreground'>
                  {activity.title}
                </span>
                <span className='text-[14px] text-muted-foreground'>
                  {activity.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <RequestDocumentExceptionModal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        isLoading={isRequestingException}
        onSubmit={requestException}
        checklistItems={checklistItems}
      />
      <RejectDocumentExceptionModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        isLoading={isRejectingException}
        onSubmit={handleConfirmReject}
      />
      <Dialog open={!!justificationToView} onOpenChange={(open) => !open && setJustificationToView(null)}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Motivo da Recusa</DialogTitle>
            <DialogDescription className='mt-2 whitespace-pre-wrap text-[14px] text-foreground'>
              {justificationToView}
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end mt-4'>
            <Button variant='outline' className='rounded-full' onClick={() => setJustificationToView(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
