import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { DocumentFilePreview } from '@/ui/document-engine/widgets/components/document-file-preview'
import { useDocumentViewer } from './use-document-viewer'

export const DocumentViewerPage = () => {
  const {
    file,
    fileId,
    isLoadingFile,
    isErrorFile,
    format,
    formattedDate,
    backLabel,
    handleBack,
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
          {backLabel}
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
              <DocumentFilePreview
                documentFileId={fileId}
                heightClassName='aspect-[1/1.4]'
                loadingLabel='Gerando visualização segura...'
                showPageCount={false}
                // showDownloadAction
              />

              <div className='flex items-center justify-between px-6 py-3 border-t border-border/40 bg-card/50'>
                <div className='flex flex-col'>
                  <span className='text-[10px] uppercase font-semibold text-muted-foreground'>
                    Arquivo
                  </span>

                  <span className='text-xs font-semibold text-foreground'>
                    {format} - {formattedFileSize}
                  </span>
                </div>
                {/* <Button type='button' variant='outline' className='rounded-pill gap-2'>
                  Baixar arquivo
                </Button> */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
