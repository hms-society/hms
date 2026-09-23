import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/ui/shadcn/dialog'

type PieceViewerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenEditor: () => void
  onOpenReview: () => void
}

export function PieceViewerDialog({
  open,
  onOpenChange,
  onOpenEditor,
  onOpenReview,
}: PieceViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[95vh] overflow-hidden p-0 sm:max-w-[900px]'>
        <DialogTitle className='sr-only'>Visualizador de peça</DialogTitle>
        <DialogDescription className='sr-only'>
          Visualização da versão atual da peça.
        </DialogDescription>
        <header className='border-b border-border px-5 py-4'>
          <p className='text-xs text-muted-foreground'>
            Caso CASO-20260703-0089 · Peças · Requerimento Administrativo
          </p>
          <div className='mt-1 flex flex-wrap items-center justify-between gap-3'>
            <h2 className='font-serif text-xl font-semibold'>
              Requerimento Administrativo — Aposentadoria por Tempo de Contribuição
            </h2>
            <Badge variant='success'>v3 · Versão atual</Badge>
          </div>
          <p className='mt-2 text-xs text-muted-foreground'>
            Mariana Costa · Submetida hoje, 10:12 · Base: minuta gerada com IA (v1)
          </p>
        </header>
        <main className='max-h-[65vh] overflow-y-auto bg-muted/50 p-6'>
          <article className='mx-auto min-h-[520px] max-w-[660px] bg-card p-10 shadow-sm'>
            <p className='text-center font-serif text-sm font-semibold'>
              AO INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS
            </p>
            <p className='mt-2 text-center text-xs text-muted-foreground'>
              Agência da Previdência Social — São José dos Campos/SP
            </p>
            <p className='mt-10 text-sm leading-7'>
              ANTÔNIO CARVALHO DA SILVA, brasileiro, casado, industrial, portador do RG nº
              •••.••• e CPF nº •••.•••-45, residente e domiciliado à Rua Vitória Régia, nº
              210, requer a concessão do benefício previdenciário.
            </p>
            <h3 className='mt-8 text-center font-serif text-sm font-semibold'>
              APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO
            </h3>
            <p className='mt-8 text-sm leading-7'>
              Pelas razões de fato e de direito a seguir expostas, com a juntada dos
              documentos comprobatórios do dossiê aprovado em 14/07/2026, requer o
              reconhecimento dos requisitos legais.
            </p>
            <h3 className='mt-8 font-serif text-sm font-semibold'>I — DOS FATOS</h3>
            <p className='mt-3 text-sm leading-7'>
              O requerente é filiado ao Regime Geral de Previdência Social desde
              12/03/1989, tendo exercido atividade laboral ininterrupta devidamente
              registrada.
            </p>
          </article>
        </main>
        <footer className='flex flex-wrap items-center justify-between gap-2 border-t border-border p-4'>
          <Button variant='outline' size='sm'>
            <Icon name='refresh-cw' /> Comparar com outra versão
          </Button>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm'>
              <Icon name='download' />
            </Button>
            <Button variant='outline' size='sm' onClick={onOpenEditor}>
              <Icon name='pencil' /> Abrir no editor
            </Button>
            <Button size='sm' onClick={onOpenReview}>
              <Icon name='eye' /> Abrir revisão técnica
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
