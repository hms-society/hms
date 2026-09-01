import { Document as PdfDocument, Page, pdfjs } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useDocumentFilePreview } from './use-document-file-preview'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export type DocumentFilePreviewProps = {
  documentFileId: string
  heightClassName?: string
  loadingLabel?: string
  showPageCount?: boolean
  showDownloadAction?: boolean
}

export const DocumentFilePreview = ({
  documentFileId,
  heightClassName = 'h-[520px]',
  loadingLabel = 'Renderizando documento...',
  showPageCount = true,
  showDownloadAction = false,
}: DocumentFilePreviewProps) => {
  const {
    file,
    fileUrl,
    numPages,
    setNumPages,
    pageWidth,
    isDragging,
    canPan,
    viewerRef,
    isLoadingFile,
    isErrorFile,
    isLoadingUrl,
    isErrorUrl,
    format,
    handleDownload,
    handleZoomIn,
    handleZoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    minZoom,
    maxZoom,
    zoom,
  } = useDocumentFilePreview(documentFileId)

  return (
    <div className='flex flex-col bg-muted/10'>
      <div className='flex items-center justify-between px-6 py-4'>
        <span className='font-sans text-sm font-semibold text-foreground'>
          Documento original
        </span>

        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-8 rounded-lg bg-card'
            onClick={handleZoomOut}
            disabled={zoom <= minZoom}
            aria-label='Reduzir zoom'
          >
            <Icon name='zoom-out' className='size-4 text-muted-foreground' />
          </Button>

          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-8 rounded-lg bg-card'
            onClick={handleZoomIn}
            disabled={zoom >= maxZoom}
            aria-label='Ampliar zoom'
          >
            <Icon name='zoom-in' className='size-4 text-muted-foreground' />
          </Button>
        </div>
      </div>

      <div className='flex flex-col items-center justify-center px-6 py-6'>
        <div
          className={`relative flex w-full max-w-5xl items-center justify-center overflow-hidden rounded-md border border-border/50 bg-white shadow-sm ${heightClassName}`}
        >
          {isLoadingFile || isLoadingUrl ? (
            <div className='flex flex-col items-center gap-2 text-muted-foreground'>
              <Icon name='refresh-cw' className='size-8 animate-spin' />
              <span className='font-sans text-sm'>{loadingLabel}</span>
            </div>
          ) : isErrorFile || isErrorUrl || !fileUrl || !file ? (
            <div className='flex flex-col items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive'>
              <Icon name='triangle-alert' className='size-8' />
              <span className='font-sans text-sm font-medium'>
                Não foi possível carregar o arquivo para visualização.
              </span>
            </div>
          ) : format === 'PDF' ? (
            <div
              className='absolute inset-0 overflow-auto bg-white'
              ref={viewerRef}
              role='application'
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                cursor: canPan ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
            >
              <div className='flex min-w-max justify-start px-4 py-4' draggable={false}>
                <PdfDocument
                  file={fileUrl}
                  onLoadSuccess={({ numPages: totalPages }) => setNumPages(totalPages)}
                  loading={
                    <div className='flex flex-col items-center gap-2 py-10 text-muted-foreground'>
                      <Icon name='refresh-cw' className='size-8 animate-spin' />
                      <span className='font-sans text-sm'>Renderizando PDF...</span>
                    </div>
                  }
                  error={
                    <div className='flex flex-col items-center gap-2 py-10 text-destructive'>
                      <Icon name='triangle-alert' className='size-8' />
                      <span className='font-sans text-sm'>
                        Não foi possível renderizar o PDF.
                      </span>
                    </div>
                  }
                >
                  {Array.from({ length: numPages }, (_, index) => index + 1).map(
                    (pageNumber) => (
                      <Page
                        key={pageNumber}
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className='mb-4 shadow-sm'
                      />
                    ),
                  )}
                </PdfDocument>
              </div>
            </div>
          ) : ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(format) ? (
            <img
              src={fileUrl}
              alt={file.originalName}
              className='absolute inset-0 size-full object-contain p-2'
            />
          ) : (
            <div className='flex flex-col items-center p-8 text-center text-muted-foreground'>
              <Icon name='file-text' className='mb-4 size-16 opacity-20' />
              <p className='font-sans text-sm'>
                O formato {format} não possui visualizador web nativo.
              </p>
            </div>
          )}
        </div>

        {(showPageCount || showDownloadAction) &&
          format === 'PDF' &&
          !isErrorUrl &&
          !isErrorFile && (
            <div className='mt-4 flex items-center gap-2'>
              {showPageCount && (
                <Badge
                  variant='outline'
                  className='bg-card px-3 py-1 font-sans text-[10px] text-muted-foreground shadow-sm'
                >
                  {numPages > 0 ? `${numPages} página(s)` : 'PDF'}
                </Badge>
              )}

              {showDownloadAction && (
                <Button
                  type='button'
                  variant='outline'
                  className='h-8 gap-2 rounded-pill bg-card px-3 font-sans text-xs'
                  onClick={handleDownload}
                  disabled={!fileUrl || isLoadingUrl}
                >
                  <Icon name='download' className='size-3.5 text-muted-foreground' />
                  Baixar arquivo
                </Button>
              )}
            </div>
          )}
      </div>
    </div>
  )
}
