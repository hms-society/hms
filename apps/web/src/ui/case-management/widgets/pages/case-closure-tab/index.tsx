import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'
import { ClosureMilestone } from './closure-milestone'
import { ClosureChecklistItem } from './closure-checklist-item'
import { CLOSURE_OUTCOMES, useCaseClosureTab } from './use-case-closure-tab'

export type CaseClosureTabProps = {
  canManage: boolean
}

export const CaseClosureTab = ({ canManage }: CaseClosureTabProps) => {
  const {
    canConclude,
    completedSteps,
    isConcluded,
    isFinancialSettlementPending,
    isReadOnly,
    isSettlementComplete,
    isArchiveComplete,
    isNewDemandCreated,
    outcome,
    outcomeSummary,
    isOutcomeEditorOpen,
    setOutcomeEditorOpen,
    setOutcome,
    setOutcomeSummary,
    handleArchiveDocuments,
    handleConfirmSettlement,
    handleConclude,
    handleCreateNewDemand,
    handleMarkNoSettlement,
    handleOpenOutcomeEditor,
    handleSaveOutcome,
    handleStartSettlement,
  } = useCaseClosureTab({ canManage })

  return (
    <div className='flex flex-col gap-4'>
      {!canManage && (
        <div
          className='rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground'
          role='status'
        >
          Somente o gestor ativo do caso pode executar o rito de encerramento. Esta
          visualização é somente leitura.
        </div>
      )}
      <section
        className='rounded-xl border border-border bg-card p-5 shadow-sm'
        aria-labelledby='closure-outcome-title'
      >
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
              Resultado do caso
            </p>
            <h2
              id='closure-outcome-title'
              className='mt-1 font-serif text-2xl font-bold text-foreground'
            >
              {outcome}
            </h2>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='success'>
              <Icon name='check-circle-2' /> Resultado registrado
            </Badge>
            <Button
              variant='outline'
              size='sm'
              onClick={handleOpenOutcomeEditor}
              disabled={isReadOnly}
            >
              <Icon name='pencil' /> Editar
            </Button>
          </div>
        </div>
        <p className='mt-4 text-sm leading-6 text-muted-foreground'>{outcomeSummary}</p>
        <div className='mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground'>
          <span className='inline-flex items-center gap-2'>
            <Icon name='calendar-days' /> Data do resultado:{' '}
            <strong className='text-foreground'>14/07/2026</strong>
          </span>
          <span>
            Registrado por <strong className='text-foreground'>Ricardo Mendes</strong> ·
            14/07 · 16:22
          </span>
        </div>
      </section>

      <section
        className='rounded-xl border border-border bg-card p-5 shadow-sm'
        aria-labelledby='closure-milestones-title'
      >
        <h2
          id='closure-milestones-title'
          className='flex items-center gap-2 font-serif text-lg font-bold text-foreground'
        >
          <Icon name='list-checks' /> Marcos de encerramento
        </h2>
        <div className='mt-5 grid gap-5 md:grid-cols-3'>
          <ClosureMilestone
            title='Resultado'
            date='14/07/2026'
            detail='registrado por Ricardo Mendes'
            complete
          />
          <ClosureMilestone
            title='Início do encerramento'
            date='14/07/2026'
            detail='automático após resultado'
            complete
          />
          <ClosureMilestone
            title='Conclusão do encerramento'
            date={isConcluded ? '15/07/2026' : '—'}
            detail={isConcluded ? 'rito concluído' : 'pendente do rito'}
            complete={isConcluded}
          />
        </div>
      </section>

      <section
        className='rounded-xl border border-border bg-card p-5 shadow-sm'
        aria-labelledby='closure-checklist-title'
      >
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
              Rito de encerramento
            </p>
            <h2
              id='closure-checklist-title'
              className='mt-1 font-serif text-xl font-bold text-foreground'
            >
              Checklist de conclusão
            </h2>
          </div>
          <Badge variant={completedSteps === 3 ? 'success' : 'attention'}>
            {completedSteps} de 3 concluídos
          </Badge>
        </div>
        <div className='mt-4 flex flex-col gap-2'>
          <ClosureChecklistItem
            title='Comunicação final ao cliente'
            complete
            detail='Comunicação enviada ao cliente informando o desfecho e os próximos passos do encerramento (depósito, prestação de contas, atendimento final).'
            status='Concluído'
          >
            <span className='inline-flex items-center gap-1 text-xs font-medium text-primary'>
              <Icon name='external-link' /> Ver comunicação em Comunicações · 15/07 ·
              10:45 · Ricardo Mendes
            </span>
          </ClosureChecklistItem>
          <ClosureChecklistItem
            title='Acerto e repasse ao cliente'
            complete={isSettlementComplete}
            detail='Recebimento do crédito judicial ou acordo → cálculo do acerto (honorários, despesas, custas e adiantamentos) → repasse ao cliente com comprovante bancário → recibo/termo de quitação.'
            status={
              isSettlementComplete
                ? 'Concluído'
                : isFinancialSettlementPending
                  ? 'Aguardando crédito'
                  : 'Aguardando crédito'
            }
          >
            {!isReadOnly && !isSettlementComplete && (
              <div className='flex flex-wrap gap-2'>
                {isFinancialSettlementPending ? (
                  <Button size='sm' onClick={handleConfirmSettlement}>
                    <Icon name='check' /> Confirmar crédito e repasse
                  </Button>
                ) : (
                  <Button size='sm' onClick={handleStartSettlement}>
                    <Icon name='coins' /> Iniciar acerto financeiro
                  </Button>
                )}
                <Button variant='outline' size='sm' onClick={handleMarkNoSettlement}>
                  Sem valores a repassar
                </Button>
              </div>
            )}
          </ClosureChecklistItem>
          <ClosureChecklistItem
            title='Arquivamento dos documentos'
            complete={isArchiveComplete}
            detail='Arquivamento formal do dossiê e materiais do caso. O histórico permanece acessível à equipe interna após encerramento.'
            status={isArchiveComplete ? 'Concluído' : 'Pendente'}
          >
            {!isReadOnly && !isArchiveComplete && (
              <Button size='sm' onClick={handleArchiveDocuments}>
                <Icon name='clipboard-list' /> Arquivar dossiê e materiais
              </Button>
            )}
          </ClosureChecklistItem>
        </div>
      </section>

      <section
        className='flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between'
        aria-label='Ações de encerramento'
      >
        <div className='flex items-start gap-3'>
          <Icon
            name={canConclude ? 'check-circle-2' : 'lock'}
            className='mt-0.5 size-4 text-muted-foreground'
          />
          <div>
            <p className='text-sm font-semibold text-foreground'>
              {isConcluded
                ? 'Encerramento concluído'
                : canConclude
                  ? 'Rito pronto para conclusão'
                  : 'Aguardando conclusão do rito'}
            </p>
            <p className='text-xs text-muted-foreground'>
              {isConcluded
                ? 'O caso está encerrado e permanece disponível para consulta.'
                : `Complete ${3 - completedSteps} ${3 - completedSteps === 1 ? 'item pendente' : 'itens pendentes'} do rito para habilitar a conclusão do caso.`}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='outline'
            onClick={handleCreateNewDemand}
            disabled={isReadOnly || isNewDemandCreated}
          >
            Nova demanda deste cliente
          </Button>
          <Button onClick={handleConclude} disabled={!canConclude}>
            {isConcluded ? (
              'Encerramento concluído'
            ) : (
              <>
                <Icon name='check' /> Concluir encerramento
              </>
            )}
          </Button>
        </div>
        {isNewDemandCreated && (
          <p className='text-right text-xs text-muted-foreground' role='status'>
            Demanda demonstrativa iniciada para este cliente.
          </p>
        )}
      </section>

      <Dialog open={isOutcomeEditorOpen} onOpenChange={setOutcomeEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar resultado do caso</DialogTitle>
            <DialogDescription>
              Atualize o resultado e o resumo registrado para este encerramento.
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='closure-outcome'>Resultado</Label>
              <Select
                value={outcome}
                onValueChange={(value) =>
                  setOutcome(value as (typeof CLOSURE_OUTCOMES)[number])
                }
              >
                <SelectTrigger id='closure-outcome'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLOSURE_OUTCOMES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='closure-summary'>Resumo do resultado</Label>
              <Textarea
                id='closure-summary'
                value={outcomeSummary}
                onChange={(event) => setOutcomeSummary(event.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOutcomeEditorOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOutcome} disabled={!outcomeSummary.trim()}>
              Salvar resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
