import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PdfViewerPanelProps = {
  fileSize: string
  integrity: string
  duplicity: string
}

export const PdfViewerPanel = ({
  fileSize,
  integrity,
  duplicity,
}: PdfViewerPanelProps) => {
  return (
    <section className='flex flex-col bg-muted/10 p-5'>
      <div className='flex items-center justify-between pb-4'>
        <h2 className='font-sans text-sm font-semibold text-foreground'>
          Documento original
        </h2>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='icon-sm' className='size-8 rounded-md bg-card'>
            <Icon name='zoom-in' className='size-4 text-muted-foreground' />
          </Button>
          <Button variant='outline' size='icon-sm' className='size-8 rounded-md bg-card'>
            <Icon name='zoom-out' className='size-4 text-muted-foreground' />
          </Button>
          <Button variant='outline' size='icon-sm' className='size-8 rounded-md bg-card'>
            <Icon name='download' className='size-4 text-muted-foreground' />
          </Button>
        </div>
      </div>

      <div className='flex flex-1 flex-col items-center justify-center rounded-xl bg-muted/30 p-8 shadow-inner'>
        <div className='flex h-[400px] w-full max-w-[320px] flex-col bg-white shadow-sm border border-border'>
          <div className='flex flex-1 flex-col gap-4 p-8'>
            <div className='h-2 w-32 bg-muted rounded-full self-center mb-4' />
            <div className='h-1.5 w-full bg-muted rounded-full' />
            <div className='h-1.5 w-5/6 bg-muted rounded-full' />
            <div className='h-1.5 w-4/6 bg-muted rounded-full' />
            <div className='mt-6 flex flex-col gap-2 rounded-lg bg-muted/20 p-4'>
              <div className='h-1.5 w-24 bg-muted-foreground/30 rounded-full' />
              <div className='h-1 w-full bg-muted-foreground/20 rounded-full' />
              <div className='h-1 w-2/3 bg-muted-foreground/20 rounded-full' />
            </div>
          </div>
        </div>
        <Badge
          variant='outline'
          className='mt-4 bg-card px-3 py-1 text-[10px] text-muted-foreground shadow-sm'
        >
          Página 1 de 1
        </Badge>
      </div>

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
