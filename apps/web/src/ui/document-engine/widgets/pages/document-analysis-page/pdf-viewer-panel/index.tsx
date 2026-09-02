import { DocumentFilePreview } from '@/ui/document-engine/widgets/components/document-file-preview'

export type PdfViewerPanelProps = {
  documentFileId: string
  fileSize: string
  integrity: string
  duplicity: string
}

export const PdfViewerPanel = ({
  documentFileId,
  fileSize,
  integrity,
  duplicity,
}: PdfViewerPanelProps) => {
  return (
    <section className='flex flex-col bg-muted/10 p-5'>
      <DocumentFilePreview
        documentFileId={documentFileId}
        heightClassName='h-[520px]'
        loadingLabel='Renderizando documento...'
        showPageCount
        // showDownloadAction
      />

      <div className='mt-5 grid grid-cols-3 gap-4 rounded-xl bg-card p-4 shadow-sm border border-border'>
        <div className='flex flex-col gap-0.5'>
          <span className='font-sans text-[10px] text-muted-foreground'>Arquivo</span>
          <span className='font-sans text-xs font-semibold text-foreground'>
            PDF - {fileSize}
          </span>
        </div>
        <div className='flex flex-col gap-0.5'>
          <span className='font-sans text-[10px] text-muted-foreground'>
            Integridade do arquivo
          </span>
          <span className='font-sans text-xs font-semibold text-foreground'>
            {integrity}
          </span>
        </div>
        <div className='flex flex-col gap-0.5'>
          <span className='font-sans text-[10px] text-muted-foreground'>Duplicidade</span>
          <span className='font-sans text-xs font-semibold text-foreground'>
            {duplicity}
          </span>
        </div>
      </div>
    </section>
  )
}
