import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DocumentStatusChip } from '../../document-status-chip'
import { useDocumentPackageRow } from './use-document-package-row'
import type { DocumentPackageRowProps } from './use-document-package-row'

export type { DocumentPackageRowProps } from './use-document-package-row'

export const DocumentPackageRow = (props: DocumentPackageRowProps) => {
  const {
    item,
    onGenerateDocument,
    onCancelDocumentGeneration,
    isCancellingDocument = false,
    onRefreshDocument,
    isReadOnly = false,
    renderAction,
  } = useDocumentPackageRow(props)

  return (
    <li className='flex flex-col gap-2 border-b border-border/80 px-1 py-3 last:border-b-0 sm:px-2'>
      <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <span className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-primary'>
            <Icon name='file-text' className='size-3.5' />
          </span>
          <div className='min-w-0 space-y-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='truncate text-xs font-semibold text-foreground sm:text-sm'>
                {item.title}
              </h2>
              <DocumentStatusChip status={item.status} label={item.statusLabel} />
              {item.isCurrent && <DocumentStatusChip status='current' />}
            </div>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-1.5 sm:justify-end'>
          {item.status === 'generating' ? (
            <>
              <span className='inline-flex animate-pulse items-center gap-1.5 text-xs font-medium text-primary'>
                <Icon name='refresh-cw' className='size-4 animate-spin' />
                Aguardando resultado
              </span>
              {onCancelDocumentGeneration && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={isReadOnly || isCancellingDocument}
                  aria-busy={isCancellingDocument}
                  onClick={() => void onCancelDocumentGeneration(item.id)}
                >
                  <Icon name='x' />
                  Cancelar geração
                </Button>
              )}
            </>
          ) : item.status === 'not_generated' || item.status === 'failed' ? (
            onGenerateDocument && (
              <Button
                type='button'
                variant='brand'
                size='sm'
                disabled={isReadOnly || item.isGenerating}
                onClick={() => void onGenerateDocument(item.id)}
              >
                <Icon name={item.status === 'failed' ? 'refresh-cw' : 'list-plus'} />
                {item.status === 'failed' ? 'Tentar novamente' : 'Gerar documento'}
              </Button>
            )
          ) : item.latestVersion ? (
            <>
              {item.status === 'in_review' &&
                !isReadOnly &&
                renderAction?.('review', item)}
              {(item.status === 'rejected' || item.status === 'approved') &&
                renderAction?.('view', item)}
            </>
          ) : null}
        </div>
      </div>

      {item.isTimedOut && onRefreshDocument && (
        <div
          role='alert'
          className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300'
        >
          <span className='inline-flex items-center gap-1.5'>
            <Icon name='triangle-alert' />
            Ainda não foi possível confirmar o resultado da geração.
          </span>
          <Button
            type='button'
            variant='outline'
            size='xs'
            disabled={isReadOnly}
            onClick={() => void onRefreshDocument()}
          >
            <Icon name='refresh-cw' />
            Atualizar
          </Button>
        </div>
      )}
    </li>
  )
}
