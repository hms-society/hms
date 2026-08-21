import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  type DocumentBatchCardProps,
  useDocumentBatchCard,
} from './use-document-batch-card'

export type { DocumentBatchCardProps } from './use-document-batch-card'

export const DocumentBatchCard = ({ batch }: DocumentBatchCardProps) => {
  const { handleToggleExpanded, handleViewFile, isExpanded } = useDocumentBatchCard()

  return (
    <Card className='mb-4 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
      <CardHeader
        className='flex cursor-pointer flex-row items-center justify-between space-y-0 border-b border-border bg-muted/40 px-5 py-3 transition-colors hover:bg-muted/60'
        onClick={handleToggleExpanded}
      >
        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
          <span className='font-mono font-medium tracking-wide text-foreground'>
            {batch.readableId}
          </span>
          <span className='flex items-center gap-1.5 capitalize'>
            <Icon
              name={batch.channel === 'whatsapp' ? 'message-square' : 'arrow-up'}
              className='h-3.5 w-3.5'
            />
            {batch.channel === 'whatsapp' ? 'WhatsApp' : 'Upload interno'}
          </span>
          <span>
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
              new Date(batch.createdAt),
            )}
          </span>
        </div>

        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-xs text-muted-foreground hover:text-foreground'
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Recolher lote' : 'Expandir lote'}
          onClick={(event) => {
            event.stopPropagation()
            handleToggleExpanded()
          }}
        >
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} className='size-3.5' />
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className='flex flex-col p-0'>
          {batch.files && batch.files.length > 0 ? (
            batch.files.map((file: any) => (
              <div
                key={file.id}
                className='flex items-center justify-between border-b border-border px-5 py-4 last:border-0'
              >
                <div className='flex items-center gap-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                    <Icon name='file-text' className='h-5 w-5' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>
                      {file.originalName}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {file.mimeType} • {(file.sizeBytes / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-6'>
                  <Badge className='border-none bg-green-100 font-medium text-green-700 shadow-none hover:bg-green-100'>
                    Recebido
                  </Badge>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='text-muted-foreground'
                    aria-label={`Visualizar ${file.originalName}`}
                    onClick={() => handleViewFile(file.id)}
                  >
                    <Icon name='eye' className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className='px-5 py-4 text-center text-xs text-muted-foreground'>
              Nenhum arquivo processado neste lote.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
