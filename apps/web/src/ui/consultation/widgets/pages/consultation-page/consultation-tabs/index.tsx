import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export type ConsultationTabsProps = {
  consultationId: string
  activeTab: 'details' | 'form' | 'package'
  isDocumentsEnabled: boolean
}

export const ConsultationTabs = ({
  consultationId,
  activeTab,
  isDocumentsEnabled,
}: ConsultationTabsProps) => {
  return (
    <div className='w-full overflow-x-auto'>
      <div className='flex min-w-max items-center gap-2 sm:gap-6 border-b border-slate-200 text-sm font-medium text-slate-500'>
        <Anchor
          route='consultation'
          params={{ consultationId }}
          aria-current={activeTab === 'details' ? 'page' : undefined}
          className={`flex items-center gap-2 whitespace-nowrap pb-3 transition-colors ${
            activeTab === 'details'
              ? 'border-b-2 border-teal-800 font-semibold text-teal-800'
              : 'hover:text-slate-800'
          }`}
        >
          <Icon name='clipboard-list' className='h-4 w-4 shrink-0' />
          <span>Detalhes</span>
        </Anchor>

        <Anchor
          route='consultationAttendanceForm'
          params={{ consultationId }}
          aria-current={activeTab === 'form' ? 'page' : undefined}
          className={`flex items-center gap-2 whitespace-nowrap pb-3 transition-colors ${
            activeTab === 'form'
              ? 'border-b-2 border-teal-800 font-semibold text-teal-800'
              : 'hover:text-slate-800'
          }`}
        >
          <Icon name='file-text' className='h-4 w-4 shrink-0' />
          <span>Ficha de atendimento</span>
        </Anchor>

        {isDocumentsEnabled ? (
          <Anchor
            route='consultationDocuments'
            params={{ consultationId }}
            aria-current={activeTab === 'package' ? 'page' : undefined}
            className={`flex items-center gap-2 whitespace-nowrap pb-3 transition-colors ${
              activeTab === 'package'
                ? 'border-b-2 border-teal-800 font-semibold text-teal-800'
                : 'hover:text-slate-800'
            }`}
          >
            <Icon name='briefcase' className='h-4 w-4 shrink-0' />
            <span>Documentos</span>
          </Anchor>
        ) : (
          <span
            aria-disabled='true'
            title='Finalize a ficha de atendimento para liberar os documentos.'
            className='flex cursor-not-allowed items-center gap-2 whitespace-nowrap pb-3 text-slate-300'
          >
            <Icon name='briefcase' className='h-4 w-4 shrink-0' />
            <span>Documentos</span>
          </span>
        )}
      </div>
    </div>
  )
}
