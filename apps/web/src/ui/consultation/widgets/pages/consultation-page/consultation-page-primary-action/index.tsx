import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useConsultationPageAction } from '../consultation-page-action-context'

export const ConsultationPagePrimaryAction = () => {
  const { primaryAction } = useConsultationPageAction()

  if (!primaryAction) return null

  return (
    <div className='flex items-center justify-end border-b border-slate-200 pb-4'>
      <Button
        type='button'
        onClick={primaryAction.onClick}
        disabled={primaryAction.isPending || primaryAction.isDisabled}
        aria-busy={primaryAction.isPending}
        aria-disabled={primaryAction.isPending || primaryAction.isDisabled}
        title={primaryAction.isDisabled ? primaryAction.disabledReason : undefined}
        className='bg-teal-800 hover:bg-teal-900 text-white rounded-full px-8 h-11 text-xs font-bold gap-2 shadow-sm cursor-pointer disabled:opacity-50'
      >
        <Icon name='check' className='w-4 h-4' />
        {primaryAction.isPending
          ? 'Finalizando...'
          : (primaryAction.label ?? 'Finalizar consulta')}
      </Button>
    </div>
  )
}
