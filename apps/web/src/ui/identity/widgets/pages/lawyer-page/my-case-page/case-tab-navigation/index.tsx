import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { TabsList, TabsTrigger } from '@/ui/shadcn/tabs'

const LAWYER_TABS = [
  { value: 'visao-geral', label: 'Visão Geral' },
  { value: 'checklist', label: 'Checklist & Dossiê', showCount: true },
  { value: 'pecas', label: 'Peças', locked: true },
  { value: 'prazos', label: 'Prazos & Tarefas' },
  { value: 'equipe', label: 'Equipe', users: true },
] as const

export type CaseTabNavigationProps = {
  dossierApproved: boolean
  pendingItemsCount: number
}

export const CaseTabNavigation = ({
  pendingItemsCount,
  dossierApproved,
}: CaseTabNavigationProps) => (
  <TabsList
    variant='line'
    className='grid w-full grid-cols-2 items-center gap-x-0 gap-y-1 text-[14px] sm:grid-cols-4 xl:grid-cols-8'
  >
    {LAWYER_TABS.map((tab) => (
      <TabsTrigger
        key={tab.value}
        value={tab.value}
        disabled={'locked' in tab && tab.locked && !dossierApproved}
        className='w-full justify-center gap-2 py-3 text-[13px]'
      >
        {'locked' in tab && tab.locked && !dossierApproved && (
          <Icon name='lock' className='size-3.5' />
        )}
        {'users' in tab && tab.users && <Icon name='users' className='size-4' />}
        {tab.label}
        {'showCount' in tab && tab.showCount && (
          <Badge variant='secondary' className='h-5 rounded-full px-1.5 text-[12px]'>
            {pendingItemsCount}
          </Badge>
        )}
      </TabsTrigger>
    ))}
  </TabsList>
)
