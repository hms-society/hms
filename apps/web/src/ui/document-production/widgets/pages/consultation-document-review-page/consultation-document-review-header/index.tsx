import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import type { ConsultationDocumentReviewViewModel } from '../use-consultation-document-review-page'

export type ConsultationDocumentReviewHeaderProps = {
  viewModel: ConsultationDocumentReviewViewModel
  pendingMarkersCount: number
  onBack: () => void
  onHistory: () => void
  onPendingMarkers: () => void
}

export const ConsultationDocumentReviewHeader = ({
  viewModel,
  pendingMarkersCount,
  onBack,
  onHistory,
  onPendingMarkers,
}: ConsultationDocumentReviewHeaderProps) => (
  <header className='flex flex-col gap-4'>
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='flex min-w-0 items-center gap-3'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          aria-label='Voltar aos documentos'
          onClick={onBack}
        >
          <Icon name='arrow-left' /> Documentos
        </Button>
        <div className='min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='truncate font-serif text-2xl font-semibold'>
              Revisar documento
            </h1>
            <Badge variant='outline'>Versão {viewModel.versionNumber}</Badge>
          </div>
          <p className='truncate text-sm font-medium text-muted-foreground'>
            {viewModel.title}
          </p>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-3'>
        {viewModel.documentSpecificationId && (
          <Anchor
            route='documentSpecification'
            params={{ documentSpecificationId: viewModel.documentSpecificationId }}
            className='inline-flex min-h-9 items-center gap-1 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <Icon name='file-text' className='shrink-0 h-3 w-3' />
            <span>Ver modelo</span>
          </Anchor>
        )}
        <Button type='button' variant='ghost' size='sm' onClick={onHistory}>
          <Icon name='history' /> Ver versões
        </Button>
      </div>
    </div>
    <div className='flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-xs text-muted-foreground'>
      <span>{viewModel.sourceLabel}</span>
      <span aria-hidden='true'>·</span>
      <span>{viewModel.createdAtLabel}</span>
      {viewModel.rejectionReason && <span>· Motivo: {viewModel.rejectionReason}</span>}
      {pendingMarkersCount > 0 && (
        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='ml-auto h-7 px-2 text-xs'
          onClick={onPendingMarkers}
        >
          <Icon name='list-search' /> Pendências ({pendingMarkersCount})
        </Button>
      )}
    </div>
  </header>
)
