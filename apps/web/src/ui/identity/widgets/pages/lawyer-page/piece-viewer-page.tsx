import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

type PieceViewerPageProps = {
  caseId: string
  documentId: string
  onClose: () => void
  onOpenEditor: () => void
  onOpenReview: () => void
}

export function PieceViewerPage({
  caseId,
  documentId,
  onClose,
  onOpenEditor,
  onOpenReview,
}: PieceViewerPageProps) {
  return (
    <div className='flex min-h-[calc(100vh-5rem)] flex-col bg-muted/50'>
      <header className='flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4'>
        <div className='min-w-0'>
          <p className='text-xs text-muted-foreground'>
            Caso {caseId} · Peças · Documento {documentId}
          </p>
          <div className='mt-1 flex flex-wrap items-center gap-3'>
            <h1 className='font-serif text-xl font-semibold'>
              Requerimento Administrativo — Aposentadoria por Tempo de Contribuição
            </h1>
            <Badge variant='success'>v3 · Versão atual</Badge>
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            Mariana Costa · Submetida hoje, 10:12 · Base: minuta gerada com IA (v1)
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Voltar para meus casos'
          onClick={onClose}
        >
          <Icon name='x' />
        </Button>
      </header>
      <main className='flex-1 overflow-y-auto p-8'>
        <article className='mx-auto min-h-[760px] max-w-[760px] bg-card px-16 py-14 shadow-sm'>
          <p className='text-center font-serif text-base font-semibold'>
            AO INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS
          </p>
          <p className='mt-2 text-center text-sm text-muted-foreground'>
            Agência da Previdência Social — São José dos Campos/SP
          </p>
          <p className='mt-14 text-sm leading-8'>
            ANTÔNIO CARVALHO DA SILVA, brasileiro, casado, industrial, portador do RG nº
            •••.••• e CPF nº •••.•••-45, residente e domiciliado à Rua Vitória Régia, nº
            210, requer a concessão do benefício previdenciário.
          </p>
          <h2 className='mt-10 text-center font-serif text-base font-semibold'>
            APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO
          </h2>
          <p className='mt-10 text-sm leading-8'>
            Pelas razões de fato e de direito a seguir expostas, com a juntada dos
            documentos comprobatórios do dossiê aprovado em 14/07/2026, requer o
            reconhecimento dos requisitos legais.
          </p>
          <h2 className='mt-10 font-serif text-base font-semibold'>I — DOS FATOS</h2>
          <p className='mt-3 text-sm leading-8'>
            O requerente é filiado ao Regime Geral de Previdência Social desde 12/03/1989,
            tendo exercido atividade laboral ininterrupta devidamente registrada.
          </p>
        </article>
      </main>
      <footer className='flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-6 py-4'>
        <Button variant='outline' size='sm'>
          <Icon name='refresh-cw' /> Comparar com outra versão
        </Button>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' aria-label='Baixar peça'>
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
    </div>
  )
}
