import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useDocumentViewer } from './use-document-viewer'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export const DocumentViewerPage = () => {
  const {
    file,
    fileUrl,
    numPages,
    setNumPages,
    zoom,
    pageWidth,
    isDragging,
    canPan,
    viewerRef,
    isLoadingFile,
    isErrorFile,
    isLoadingUrl,
    isErrorUrl,
    format,
    formattedDate,
    handleZoomIn,
    handleZoomOut,
    handleBack,
    handleDownload,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    minZoom,
    maxZoom,
    formattedFileSize,
  } = useDocumentViewer()

  if (isLoadingFile) {
    return <div>Carregando visualizador...</div>
  }

  if (isErrorFile || !file) {
    return <div>Erro ao carregar os metadados do arquivo.</div>
  }

  return (
    <div className='flex flex-col items-center gap-6 w-full'>
      <div className='w-full max-w-6xl'>
        <div className='mb-6'>
          <h1 className='text-2xl font-semibold text-foreground'>Editor de validação</h1>

          <p className='text-sm text-muted-foreground mt-1'>
            Revise o documento, confirme o vínculo e registre a decisão final.
          </p>
        </div>

        <Button
          variant='outline'
          className='rounded-pill gap-2 border-border/80 text-foreground mb-4'
          onClick={handleBack}
        >
          Voltar aos documentos
        </Button>

        <Card className='shadow-sm border-border overflow-hidden rounded-xl bg-card w-full'>
          <div className='flex flex-col gap-1 border-b border-border px-6 py-5'>
            <div className='flex items-center gap-3'>
              <h2 className='text-base font-bold text-foreground'>{file.originalName}</h2>

              <Badge
                variant='secondary'
                className='bg-muted text-xs font-semibold text-muted-foreground shadow-none'
              >
                {format}
              </Badge>
            </div>

            <span className='text-xs text-muted-foreground'>
              Portal do cliente • Recebido em {formattedDate}
            </span>
          </div>

          <CardContent className='p-0'>
            <div className='flex flex-col bg-[#F4F4F5]'>
              <div className='flex items-center justify-between px-6 py-4'>
                <span className='text-sm font-semibold text-foreground'>
                  Documento original
                </span>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    className='w-8 h-8 rounded-lg bg-card'
                    onClick={handleZoomIn}
                    disabled={zoom >= maxZoom}
                  >
                    <Icon name='zoom-in' className='w-4 h-4 text-muted-foreground' />
                  </Button>

                  <Button
                    variant='outline'
                    size='icon'
                    className='w-8 h-8 rounded-lg bg-card'
                    onClick={handleZoomOut}
                    disabled={zoom <= minZoom}
                  >
                    <Icon name='zoom-out' className='w-4 h-4 text-muted-foreground' />
                  </Button>
                </div>
              </div>

              <div className='flex flex-col items-center justify-center py-6 px-6 min-h-[500px]'>
                <div className='w-full max-w-5xl bg-white border border-border/50 shadow-sm rounded-md aspect-[1/1.4] flex items-center justify-center overflow-hidden relative'>
                  {isLoadingUrl ? (
                    <div className='flex flex-col items-center text-muted-foreground gap-2'>
                      <Icon name='refresh-cw' className='w-8 h-8 animate-spin' />

                      <span className='text-sm'>Gerando visualização segura...</span>
                    </div>
                  ) : isErrorUrl ? (
                    <div className='flex flex-col items-center text-destructive gap-2 p-8 text-center bg-destructive/5 rounded-lg border border-destructive/20'>
                      <Icon name='triangle-alert' className='w-8 h-8' />

                      <span className='text-sm font-medium'>
                        O arquivo físico não foi encontrado no Storage ou o acesso foi
                        negado pela política RLS.
                      </span>
                    </div>
                  ) : !fileUrl ? (
                    <div className='flex flex-col items-center text-muted-foreground gap-2'>
                      <Icon name='triangle-alert' className='w-8 h-8' />

                      <span className='text-sm'>
                        Não foi possível carregar a URL do arquivo.
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
                      <div
                        className='flex justify-start py-4 px-4 min-w-max'
                        draggable={false}
                      >
                        <PdfDocument
                          file={fileUrl}
                          onLoadSuccess={({ numPages: totalPages }) =>
                            setNumPages(totalPages)
                          }
                          loading={
                            <div className='flex flex-col items-center gap-2 py-10 text-muted-foreground'>
                              <Icon name='refresh-cw' className='w-8 h-8 animate-spin' />

                              <span className='text-sm'>Renderizando PDF...</span>
                            </div>
                          }
                          error={
                            <div className='flex flex-col items-center gap-2 py-10 text-destructive'>
                              <Icon name='triangle-alert' className='w-8 h-8' />

                              <span className='text-sm'>
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
                      className='absolute inset-0 w-full h-full object-contain p-2'
                    />
                  ) : (
                    <div className='flex flex-col items-center text-muted-foreground p-8 text-center'>
                      <Icon name='file-text' className='w-16 h-16 opacity-20 mb-4' />

                      <p className='text-sm'>
                        O formato {format} não possui visualizador web nativo.
                      </p>

                      <p className='text-xs mt-1'>
                        Utilize o botão de download para abri-lo localmente.
                      </p>
                    </div>
                  )}
                </div>

                {format === 'PDF' && !isErrorUrl && (
                  <Badge
                    variant='outline'
                    className='mt-4 bg-white text-muted-foreground px-3 py-1 shadow-sm font-medium'
                  >
                    Modo de Leitura
                  </Badge>
                )}
              </div>

              <div className='flex items-center justify-between px-6 py-3 border-t border-border/40 bg-card/50'>
                <div className='flex flex-col'>
                  <span className='text-[10px] uppercase font-semibold text-muted-foreground'>
                    Arquivo
                  </span>

                  <span className='text-xs font-semibold text-foreground'>
                    {format} - {formattedFileSize}
                  </span>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  className='rounded-pill gap-2'
                  onClick={handleDownload}
                  disabled={!fileUrl || isLoadingUrl}
                >
                  <Icon name='download' className='size-4' />
                  Baixar arquivo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
