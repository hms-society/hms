import { Button } from '@/ui/shadcn/button'
import { cn } from '@/ui/shadcn/utils'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'
import {
  DocumentStatusChip,
  type DocumentStatusChipStatus,
} from '../../../components/document-status-chip'
import type { ConsultationDocumentReviewViewModel } from '../use-consultation-document-review-page'

export type DocumentVersionDecisionBarProps = {
  viewModel: ConsultationDocumentReviewViewModel
  isEditing: boolean
  isSaving: boolean
  isSubmittingDecision: boolean
  isSelectingCurrent: boolean
  isRegenerating: boolean
  isCancellingGeneration: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onApprove: () => void
  onReject: () => void
  onSelectCurrent: () => void
  onRegenerate: () => void
  onCancelGeneration: () => void
  onViewRejectionReason: () => void
}

type DecisionPresentation = {
  title: string
  description: string
  icon: IconName
  statusLabel: string
  status: DocumentStatusChipStatus
  iconClassName: string
}

const DECISION_ACTION_CLASS = 'rounded-full'

function getDecisionPresentation(
  viewModel: ConsultationDocumentReviewViewModel,
  isEditing: boolean,
): DecisionPresentation {
  if (viewModel.isGenerating) {
    return {
      title: 'Geração do documento',
      description: 'A geração está em andamento. Cancelar não afeta versões anteriores.',
      icon: 'refresh-cw',
      statusLabel: 'Gerando',
      status: 'generating',
      iconClassName: 'animate-spin text-highlight-foreground',
    }
  }

  if (viewModel.isGenerationFailed) {
    return {
      title: 'Geração do documento',
      description: 'A geração não foi concluída. O erro permanece registrado.',
      icon: 'triangle-alert',
      statusLabel: 'Falha na geração',
      status: 'failed',
      iconClassName: 'text-destructive',
    }
  }

  if (isEditing) {
    return {
      title: viewModel.isApproved ? 'Versão aprovada' : 'Edição manual',
      description:
        'As alterações ainda não foram salvas. Salvar cria uma nova versão Em revisão.',
      icon: 'pencil',
      statusLabel: viewModel.statusLabel,
      status: viewModel.status,
      iconClassName: 'text-highlight-foreground',
    }
  }

  if (viewModel.isRejected) {
    return {
      title: 'Decisão da versão',
      description:
        'A decisão é definitiva para esta versão. Gere uma nova versão para continuar.',
      icon: 'x',
      statusLabel: 'Rejeitado',
      status: 'rejected',
      iconClassName: 'text-destructive',
    }
  }

  if (viewModel.isApproved) {
    return {
      title: 'Versão aprovada',
      description: viewModel.isCurrent
        ? 'Esta é a versão aprovada utilizada atualmente.'
        : 'A aprovação é definitiva. Selecione esta versão para torná-la vigente.',
      icon: 'shield-check',
      statusLabel: 'Aprovado',
      status: 'approved',
      iconClassName: 'text-highlight-foreground',
    }
  }

  return {
    title: 'Decisão da versão',
    description: 'Revise o conteúdo antes de aprovar ou rejeitar esta versão.',
    icon: 'eye',
    statusLabel: 'Em revisão',
    status: 'in_review',
    iconClassName: 'text-highlight-foreground',
  }
}

export const DocumentVersionDecisionBar = ({
  viewModel,
  isEditing,
  isSaving,
  isSubmittingDecision,
  isSelectingCurrent,
  isRegenerating,
  isCancellingGeneration,
  onEdit,
  onCancel,
  onSave,
  onApprove,
  onReject,
  onSelectCurrent,
  onRegenerate,
  onCancelGeneration,
  onViewRejectionReason,
}: DocumentVersionDecisionBarProps) => {
  const presentation = getDecisionPresentation(viewModel, isEditing)

  return (
    <section
      aria-label='Decisão da versão'
      data-state={viewModel.generationState}
      className='flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5'
    >
      <div className='flex min-w-0 items-start gap-3'>
        <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-highlight'>
          <Icon
            name={presentation.icon}
            className={cn('size-4', presentation.iconClassName)}
          />
        </span>
        <div className='min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='font-serif text-lg font-semibold'>{presentation.title}</h2>
            <DocumentStatusChip
              status={presentation.status}
              label={presentation.statusLabel}
            />
            {viewModel.isCurrent && !viewModel.isGenerating && (
              <span className='inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground'>
                <Icon name='shield-check' className='size-3' /> Vigente
              </span>
            )}
            {viewModel.isRejected && viewModel.rejectionReason && (
              <Button
                type='button'
                variant='link'
                size='sm'
                className='h-auto px-0 text-xs font-semibold text-destructive'
                onClick={onViewRejectionReason}
              >
                Ver motivo
              </Button>
            )}
          </div>
          <p className='text-sm text-muted-foreground'>{presentation.description}</p>
        </div>
      </div>
      <div className='flex flex-wrap gap-2 sm:justify-end'>
        {viewModel.isGenerating ? (
          <Button
            type='button'
            variant='destructive'
            size='sm'
            className={DECISION_ACTION_CLASS}
            disabled={isCancellingGeneration}
            aria-busy={isCancellingGeneration}
            onClick={onCancelGeneration}
          >
            <Icon name='x' />
            {isCancellingGeneration ? 'Cancelando…' : 'Cancelar geração'}
          </Button>
        ) : viewModel.isGenerationFailed ? (
          <Button
            type='button'
            variant='default'
            size='sm'
            className={DECISION_ACTION_CLASS}
            disabled={isRegenerating}
            onClick={onRegenerate}
          >
            <Icon name='refresh-cw' />
            {isRegenerating ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        ) : isEditing ? (
          <>
            <Button
              type='button'
              variant='default'
              size='sm'
              className={DECISION_ACTION_CLASS}
              disabled={isSaving}
              onClick={onSave}
            >
              <Icon name='check' /> {isSaving ? 'Salvando…' : 'Salvar edição manual'}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className={DECISION_ACTION_CLASS}
              onClick={onCancel}
            >
              <Icon name='x' /> Cancelar edição
            </Button>
          </>
        ) : (
          <>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className={DECISION_ACTION_CLASS}
              onClick={onEdit}
            >
              <Icon name='pencil' /> Editar versão
            </Button>
            {viewModel.isInReview && (
              <>
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  className={DECISION_ACTION_CLASS}
                  disabled={isSubmittingDecision}
                  onClick={onReject}
                >
                  <Icon name='x' /> Rejeitar versão
                </Button>
                <Button
                  type='button'
                  variant='default'
                  size='sm'
                  className={DECISION_ACTION_CLASS}
                  disabled={isSubmittingDecision}
                  onClick={onApprove}
                >
                  <Icon name='check' /> Aprovar versão
                </Button>
              </>
            )}
            {viewModel.isApproved && !viewModel.isCurrent && (
              <Button
                type='button'
                variant='default'
                size='sm'
                className={DECISION_ACTION_CLASS}
                disabled={isSelectingCurrent}
                onClick={onSelectCurrent}
              >
                <Icon name='shield-check' />{' '}
                {isSelectingCurrent ? 'Atualizando…' : 'Tornar vigente'}
              </Button>
            )}
            <Button
              type='button'
              variant='secondary'
              size='sm'
              className={DECISION_ACTION_CLASS}
              disabled={isRegenerating}
              onClick={onRegenerate}
            >
              <Icon name='refresh-cw' /> Gerar nova versão
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
