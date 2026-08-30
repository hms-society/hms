import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ChecklistItemDetailHeader } from './components/detail-header'
import { ChecklistItemHistoryPanel } from './components/history-panel'
import { ChecklistItemMainPanel } from './components/main-panel'
import { ChecklistItemSidePanel } from './components/side-panel'
import { useChecklistItemDetailPage } from './use-checklist-item-detail-page'

export type ChecklistItemDetailPageProps = {
  caseId: string
  checklistItemId: string
}

export const ChecklistItemDetailPage = ({
  caseId,
  checklistItemId,
}: ChecklistItemDetailPageProps) => {
  const {
    checklistItem,
    error,
    isLoading,
    itemView,
    handleBackToCase,
    handleOpenValidationDesk,
  } = useChecklistItemDetailPage({ caseId, checklistItemId })

  if (isLoading) {
    return (
      <div className='flex min-h-[480px] items-center justify-center rounded-lg border border-border bg-card shadow-xs'>
        <div className='flex items-center gap-3 font-sans text-sm text-muted-foreground'>
          <Icon name='refresh-cw' className='size-4 animate-spin' />
          Carregando item do checklist...
        </div>
      </div>
    )
  }

  if (error || !checklistItem) {
    return (
      <div className='flex min-h-[480px] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-xs'>
        <Icon name='alert-circle' className='size-8 text-destructive' />
        <div className='flex flex-col gap-1'>
          <h1 className='font-serif text-2xl font-semibold text-foreground'>
            Item do checklist não encontrado
          </h1>
          <p className='font-sans text-sm text-muted-foreground'>
            Volte ao caso e selecione outro item do checklist documental.
          </p>
        </div>
        <Button type='button' variant='outline' onClick={handleBackToCase}>
          <Icon name='arrow-left' className='size-4' />
          Voltar ao caso
        </Button>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col gap-4 pb-10 font-sans'>
      <ChecklistItemDetailHeader
        checklistItem={checklistItem}
        itemView={itemView}
        onBackToCase={handleBackToCase}
        onOpenValidationDesk={handleOpenValidationDesk}
      />

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='flex min-w-0 flex-col gap-4'>
          <ChecklistItemMainPanel itemView={itemView} />
          <ChecklistItemHistoryPanel itemView={itemView} />
        </div>

        <ChecklistItemSidePanel checklistItem={checklistItem} itemView={itemView} />
      </div>
    </div>
  )
}
