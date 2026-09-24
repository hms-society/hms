import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'

import {
  type UsePieceFilePreviewProps,
  usePieceFilePreview,
} from './use-piece-file-preview'

export type PieceFilePreviewProps = UsePieceFilePreviewProps & {
  className?: string
  versionNumber?: number
}

export const PieceFilePreview = ({
  caseId,
  documentId,
  versionId,
  storagePath,
  className,
  versionNumber,
}: PieceFilePreviewProps) => {
  const { docxContainerRef, fileQuery, fileUrl, isRendering, renderError } =
    usePieceFilePreview({ caseId, documentId, versionId, storagePath })

  if (!storagePath) {
    return (
      <div
        className={`flex min-h-96 items-center justify-center p-8 text-sm text-muted-foreground ${className ?? ''}`}
      >
        Esta versão ainda não possui um arquivo associado no Storage.
      </div>
    )
  }

  if (fileQuery.isError) {
    return (
      <div
        className={`flex min-h-96 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-destructive ${className ?? ''}`}
      >
        <Icon name='triangle-alert' className='size-5' />
        <span>Não foi possível carregar o arquivo da peça.</span>
        <span className='max-w-full break-all font-mono text-xs text-muted-foreground'>
          {storagePath}
        </span>
      </div>
    )
  }

  if (storagePath.toLowerCase().endsWith('.docx')) {
    return (
      <div
        className={`relative min-h-96 min-w-0 max-w-full overflow-x-hidden bg-muted/30 p-5 ${className ?? ''}`}
        aria-busy={fileQuery.isLoading || isRendering}
      >
        {versionNumber ? (
          <div className='mb-3 flex justify-end gap-2'>
            <span className='text-xs text-muted-foreground'>Visualizando:</span>
            <Badge variant='info'>v{versionNumber}</Badge>
          </div>
        ) : null}
        {fileUrl ? (
          <section aria-label='Visualização do documento da peça'>
            <div ref={docxContainerRef} />
          </section>
        ) : null}
        {(fileQuery.isLoading || isRendering) && (
          <div className='absolute inset-0 flex items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground'>
            <Icon name='refresh-cw' className='size-4 animate-spin' />
            Carregando arquivo da peça...
          </div>
        )}
        {renderError && (
          <p className='p-8 text-center text-sm text-destructive'>{renderError}</p>
        )}
      </div>
    )
  }

  if (fileQuery.isLoading || !fileUrl) {
    return (
      <div
        className={`flex min-h-96 items-center justify-center text-sm text-muted-foreground ${className ?? ''}`}
      >
        Carregando arquivo da peça...
      </div>
    )
  }

  if (storagePath.toLowerCase().endsWith('.pdf')) {
    return (
      <div className={`min-w-0 max-w-full overflow-x-hidden ${className ?? ''}`}>
        {versionNumber ? (
          <div className='flex items-center justify-end gap-2 border-b bg-card px-4 py-2'>
            <span className='text-xs text-muted-foreground'>Visualizando:</span>
            <Badge variant='info'>v{versionNumber}</Badge>
          </div>
        ) : null}
        <iframe
          title='Visualização do documento da peça'
          src={fileUrl}
          className='min-h-[70vh] w-full bg-card'
        />
      </div>
    )
  }

  return (
    <div
      className={`flex min-h-96 items-center justify-center p-8 text-sm text-muted-foreground ${className ?? ''}`}
    >
      Este formato de arquivo não possui visualização no navegador.
      <a href={fileUrl} download className='ml-1 text-primary underline'>
        Baixar arquivo
      </a>
    </div>
  )
}
