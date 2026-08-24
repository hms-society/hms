import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

import {
  getChecklistActionIcon,
  getChecklistActionLabel,
  getChecklistIcon,
  getChecklistIconClasses,
  getChecklistRowClasses,
} from '../checklist-style'
import type { ActivityItem, ChecklistItem } from '../types'
import { DecisionReasonDialog } from './decision-reason-dialog'
import { useChecklistDossierTab } from './use-checklist-dossier-tab'

export type ChecklistDossierTabProps = {
  activities: ActivityItem[]
  caseId: string
  checklist: ChecklistItem[]
  expectedVersion: number
}

export const ChecklistDossierTab = ({
  activities,
  caseId,
  checklist,
  expectedVersion,
}: ChecklistDossierTabProps) => {
  const {
    canStartLegalWriting,
    checklistGateLabel,
    checklistGateRemarks,
    decisionReasonDialog,
    dossierGateLabel,
    error,
    handleApproveChecklist,
    handleApproveWithException,
    handleBlockChecklist,
    handleCancelDecisionReason,
    handleConfirmDecisionReason,
    handleDecisionReasonDialogOpenChange,
    handleRejectOnMerit,
    handleRemarksChange,
    isDecisionReasonDialogOpen,
    isChecklistComplete,
    isReviewingChecklistGate,
    mandatoryItemsCount,
    pendingItemsCount,
    reasonError,
    remarks,
    validatedItemsCount,
  } = useChecklistDossierTab({
    caseId,
    checklist,
    initialExpectedVersion: expectedVersion,
  })
  const progressPercentage =
    mandatoryItemsCount > 0
      ? Math.round((validatedItemsCount / mandatoryItemsCount) * 100)
      : 0

  return (
    <>
      <div className='flex flex-col justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 lg:flex-row lg:items-start'>
        <div className='flex items-start gap-3'>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-amber-700'>
            <Icon name='lock' className='size-3.5' />
          </div>
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-xs font-semibold text-amber-800'>
              Gate de produção jurídica
            </h2>
            <p className='text-[11px] text-amber-800/80'>
              Checklist e Dossiê Documental são gates sequenciais. O checklist pode
              avançar com aprovação humana, mas a escrita jurídica segue bloqueada até
              homologação do dossiê.
            </p>
            <div className='mt-1 flex flex-wrap gap-1.5'>
              <Badge variant='attention' className='h-5 rounded-full px-2 text-[10px]'>
                {checklistGateLabel}
              </Badge>
              <Badge variant='secondary' className='h-5 rounded-full px-2 text-[10px]'>
                {dossierGateLabel}
              </Badge>
              {!canStartLegalWriting && (
                <Badge variant='outline' className='h-5 rounded-full px-2 text-[10px]'>
                  Escrita bloqueada
                </Badge>
              )}
            </div>
            {checklistGateRemarks && (
              <p className='mt-1 text-[11px] font-medium text-amber-900'>
                Ressalvas: {checklistGateRemarks}
              </p>
            )}
            {error && (
              <p className='mt-1 text-[11px] font-medium text-destructive'>
                {error.message}
              </p>
            )}
          </div>
        </div>
        <div className='flex flex-wrap justify-end gap-2 lg:max-w-sm'>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-amber-500/20 bg-card text-amber-800 hover:bg-amber-500/20'
            disabled={!isChecklistComplete || isReviewingChecklistGate}
            onClick={handleApproveChecklist}
          >
            <Icon name='check' className='size-3' />
            Aprovar checklist
          </Button>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-amber-500/20 bg-card text-amber-800 hover:bg-amber-500/20'
            disabled={isReviewingChecklistGate}
            onClick={handleApproveWithException}
          >
            <Icon name='shield-check' className='size-3' />
            Aprovar com exceção
          </Button>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-destructive/20 bg-card text-destructive hover:bg-destructive/10'
            disabled={isReviewingChecklistGate}
            onClick={handleBlockChecklist}
          >
            <Icon name='lock' className='size-3' />
            Bloqueado/insuficiente
          </Button>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full border-destructive/20 bg-card text-destructive hover:bg-destructive/10'
            disabled={isReviewingChecklistGate}
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

      <section className='flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-xs'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='flex flex-col gap-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='font-serif text-lg font-semibold text-foreground'>
                Checklist Documental
              </h2>
              <Badge variant='attention' className='h-5 rounded-full px-2 text-[10px]'>
                Recebimento parcial
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground'>
              Instanciado do template Previdenciário v3 - 03/07/2026
            </p>
          </div>

          <div className='flex w-full max-w-56 flex-col items-end gap-1.5'>
            <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className='text-[11px] font-semibold text-foreground'>
              {validatedItemsCount} de {mandatoryItemsCount} obrigatórios -{' '}
              {progressPercentage}%
            </span>
          </div>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='brand'
            size='xs'
            className='h-7 rounded-full bg-background text-[10px]'
          >
            <Icon name='check-circle-2' className='size-3' />
            Mesa de Validação
            <Icon name='arrow-right' className='size-3' />
          </Button>
          <Button
            variant='brand'
            size='xs'
            className='h-7 rounded-full bg-background text-[10px]'
          >
            Filtrado por este caso
            <Icon name='arrow-right' className='size-3' />
          </Button>
        </div>

        <div className='flex flex-col gap-3'>
          <h3 className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            Itens obrigatórios
          </h3>
          <div className='flex flex-col gap-1.5'>
            {checklist.map((item) => (
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
                      <span className='text-xs font-semibold text-foreground'>
                        {item.title}
                      </span>
                      {item.status === 'validado' && (
                        <Badge
                          variant='success'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          Validado
                        </Badge>
                      )}
                      {item.status === 'solicitado' && (
                        <Badge
                          variant='attention'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          Solicitado
                        </Badge>
                      )}
                      {item.status === 'nao_solicitado' && (
                        <Badge
                          variant='secondary'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          Não solicitado
                        </Badge>
                      )}
                      {item.pendencies && (
                        <Badge
                          variant='destructive'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          <Icon name='alert-circle' className='size-2.5' />
                          {item.pendencies} pendência
                        </Badge>
                      )}
                    </div>
                    <span className='truncate text-[10px] text-muted-foreground'>
                      {item.documentName || item.subtitle}
                    </span>
                  </div>
                </div>

                <div className='flex shrink-0 items-center gap-2 self-end md:self-center'>
                  <Button
                    variant={item.status === 'validado' ? 'brand' : 'outline'}
                    size='xs'
                    className='h-7 rounded-full bg-accent px-2 text-[10px] text-accent-foreground'
                  >
                    <Icon name={getChecklistActionIcon(item.status)} className='size-3' />
                    {getChecklistActionLabel(item.status)}
                  </Button>
                  <Button
                    variant='outline'
                    size='icon-xs'
                    aria-label={`Abrir ${item.title}`}
                    className='size-7 rounded-full bg-card text-muted-foreground'
                  >
                    <Icon name='arrow-right' className='size-3' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-3 border-t border-border pt-3'>
          <h3 className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            Itens complementares do caso
          </h3>
          <div className='flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3'>
            <span className='text-[10px] text-muted-foreground'>
              Nenhum item complementar adicionado. Itens complementares são específicos
              deste caso e exigem justificativa — não alteram o template de origem.
            </span>
            <Button
              variant='brand'
              size='xs'
              className='h-7 rounded-full bg-background text-[10px]'
            >
              <Icon name='plus' className='size-3' />
              Adicionar item
            </Button>
          </div>
        </div>
      </section>

      <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-xs'>
        <div className='flex items-center justify-between gap-4'>
          <h2 className='font-serif text-lg font-semibold text-foreground'>
            Dossiê Documental
          </h2>
          <Badge variant='secondary' className='h-5 rounded-full px-2 text-[10px]'>
            Não iniciado
          </Badge>
        </div>
        <p className='text-[11px] text-muted-foreground'>
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
              className='flex items-center justify-between rounded-md bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground'
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
          <p className='text-[11px] text-muted-foreground'>
            {pendingItemsCount} itens ainda exigem validação ou exceção autorizada antes
            do avanço de fase.
          </p>
        )}
      </section>

      <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-xs'>
        <h2 className='font-serif text-lg font-semibold text-foreground'>
          Exceções Documentais
        </h2>
        <div className='flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground'>
          <Icon name='shield-check' className='size-3.5 text-primary' />
          Nenhuma exceção ativa neste caso.
        </div>
        <p className='text-[11px] text-muted-foreground'>
          Quando um documento não puder ser obtido, solicite exceção com justificativa. A
          aprovação é de outro perfil autorizado — o solicitante não aprova a própria
          exceção.
        </p>
        <Button
          variant='brand'
          size='xs'
          className='h-8 w-full rounded-full bg-background text-[11px]'
        >
          <Icon name='alert-triangle' className='size-3.5' />
          Solicitar exceção documental
        </Button>
      </section>

      <section className='flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-xs'>
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
                <span className='text-xs font-semibold text-foreground'>
                  {activity.title}
                </span>
                <span className='text-[10px] text-muted-foreground'>
                  {activity.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
