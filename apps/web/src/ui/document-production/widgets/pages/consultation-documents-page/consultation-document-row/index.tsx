import { Button } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DocumentStatusChip } from '../../../components/document-status-chip'
import type { ConsultationDocumentViewModel } from '../use-consultation-documents-page'

export type ConsultationDocumentRowProps = {
  item: ConsultationDocumentViewModel
  onGenerateDocument: (documentId: string) => Promise<unknown>
  onCancelDocumentGeneration: (documentId: string) => Promise<unknown>
  isCancellingDocument: boolean
  onRefreshDocument: () => Promise<unknown>
}

export const ConsultationDocumentRow = ({
  item,
  onGenerateDocument,
  onCancelDocumentGeneration,
  isCancellingDocument,
  onRefreshDocument,
}: ConsultationDocumentRowProps) => (
  <li className='flex flex-col gap-2 border-b border-border/80 px-1 py-3 last:border-b-0 sm:px-2'>
    <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 items-start gap-3'>
        <span className='mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-primary'>
          <Icon name='file-text' className='size-3.5' />
        </span>
        <div className='min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='truncate text-xs font-semibold text-foreground sm:text-sm'>
              {item.document.title}
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
              <Icon name='refresh-cw' className='animate-spin size-4' />
              Aguardando resultado
            </span>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={isCancellingDocument}
              aria-busy={isCancellingDocument}
              onClick={() => void onCancelDocumentGeneration(item.document.id)}
            >
              <Icon name='x' />
              Cancelar geração
            </Button>
          </>
        ) : item.status === 'not_generated' ? (
          <Button
            type='button'
            variant='brand'
            size='sm'
            disabled={item.isGenerating}
            onClick={() => void onGenerateDocument(item.document.id)}
          >
            <Icon name='list-plus' />
            Gerar documento
          </Button>
        ) : item.latestVersion ? (
          <>
            {item.status === 'in_review' && (
              <Button asChild variant='brand' size='sm'>
                <Anchor
                  route='consultationDocumentVersion'
                  params={item.latestVersionRouteParams}
                >
                  <Icon name='pencil' />
                  Revisar
                </Anchor>
              </Button>
            )}
            {(item.status === 'rejected' || item.status === 'approved') && (
              <Button asChild variant='ghost' size='sm'>
                <Anchor
                  route='consultationDocumentVersion'
                  params={item.latestVersionRouteParams}
                >
                  <Icon name='eye' />
                  Visualizar
                </Anchor>
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>

    {item.isTimedOut && (
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
          onClick={() => void onRefreshDocument()}
        >
          <Icon name='refresh-cw' />
          Atualizar
        </Button>
      </div>
    )}
  </li>
)
