import { Icon } from '@/ui/shared/widgets/components/icon'

interface ConsultationTabsProps {
  activeTab: 'details' | 'form' | 'package'
  onTabChange: (tab: 'details' | 'form' | 'package') => void
}

export function ConsultationTabs({ activeTab, onTabChange }: ConsultationTabsProps) {
  return (
    <div className='w-full overflow-x-auto'>
      <div className='flex min-w-max items-center gap-2 sm:gap-6 border-b border-slate-200 text-sm font-medium text-slate-500'>
        <button
          type='button'
          onClick={() => onTabChange('details')}
          className={`flex items-center gap-2 whitespace-nowrap pb-3 transition-colors ${
            activeTab === 'details'
              ? 'border-b-2 border-teal-800 font-semibold text-teal-800'
              : 'hover:text-slate-800'
          }`}
        >
          <Icon name='clipboard-list' className='h-4 w-4 shrink-0' />
          <span>Detalhes</span>
        </button>

        <button
          type='button'
          onClick={() => onTabChange('form')}
          className={`flex items-center gap-2 whitespace-nowrap pb-3 transition-colors ${
            activeTab === 'form'
              ? 'border-b-2 border-teal-800 font-semibold text-teal-800'
              : 'hover:text-slate-800'
          }`}
        >
          <Icon name='file-text' className='h-4 w-4 shrink-0' />
          <span>Ficha de Atendimento</span>
        </button>

        <button
          type='button'
          disabled
          className='flex items-center gap-2 whitespace-nowrap pb-3 text-slate-400 opacity-70 cursor-not-allowed'
        >
          <Icon name='briefcase' className='h-4 w-4 shrink-0' />
          <span>Pacote de documentos da consulta</span>
          <Icon name='shield-check' className='h-3 w-3 shrink-0' />
        </button>
      </div>
    </div>
  )
}
