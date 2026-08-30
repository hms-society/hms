import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useChecklistItemDetailPage } from './use-checklist-item-detail-page'

export type ChecklistItemDetailPageProps = {
  caseId: string
  checklistItemId: string
}

export const ChecklistItemDetailPage = ({
  caseId,
  checklistItemId,
}: ChecklistItemDetailPageProps) => {
  const { handleBackToCase } = useChecklistItemDetailPage({ caseId, checklistItemId })

  return (
    <div className='flex min-h-[480px] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-xs'>
      <div className='flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <Icon name='file-text' className='size-5' />
      </div>
      <div className='flex flex-col gap-1'>
        <h1 className='font-serif text-2xl font-semibold text-foreground'>
          Detalhe do item do checklist
        </h1>
        <p className='font-sans text-sm text-muted-foreground'>
          Tela reservada para o contexto do item selecionado.
        </p>
      </div>
      <Button type='button' variant='outline' onClick={handleBackToCase}>
        <Icon name='arrow-left' className='size-4' />
        Voltar ao caso
      </Button>
    </div>
  )
}
