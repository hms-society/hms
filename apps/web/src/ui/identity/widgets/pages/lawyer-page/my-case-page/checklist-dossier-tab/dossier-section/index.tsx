import { Badge } from '@/ui/shadcn/badge'
import { DossierMilestone } from '../dossier-milestone'

export type DossierSectionProps = { pendingItemsCount: number }

export const DossierSection = ({ pendingItemsCount }: DossierSectionProps) => (
  <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
    <div className='flex items-center justify-between gap-4'>
      <h2 className='font-serif text-lg font-semibold text-foreground'>
        Dossiê Documental
      </h2>
      <Badge variant='secondary' className='h-6 rounded-full px-3 text-[12px]'>
        Não iniciado
      </Badge>
    </div>
    <p className='text-[14px] text-muted-foreground'>
      O dossiê é formado automaticamente pelos documentos validados assim que o checklist
      final for aprovado. É a base documental oficial da produção jurídica.
    </p>
    <div className='flex flex-col gap-1.5'>
      <DossierMilestone icon='list-checks' label='Checklist aprovado' />
      <DossierMilestone icon='file-text' label='Dossiê formado e aprovado' />
      <DossierMilestone icon='pencil' label='Produção jurídica liberada' />
    </div>
    {pendingItemsCount > 0 && (
      <p className='text-[14px] text-muted-foreground'>
        {pendingItemsCount} itens ainda exigem validação ou exceção autorizada antes do
        avanço de fase.
      </p>
    )}
  </section>
)
