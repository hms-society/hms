import { Link, useRouterState } from '@tanstack/react-router'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { Tabs, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'

export function AgendaTabs() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  const role = currentCollaborator?.profile
  const isLawyerOrSupervisor =
    role === CollaboratorProfile.Lawyer || role === CollaboratorProfile.Supervisor

  const activeTab = pathname.startsWith('/agenda/minha-disponibilidade')
    ? 'minha-disponibilidade'
    : 'consultas'

  if (!isLawyerOrSupervisor) {
    return null
  }

  return (
    <div className='w-full border-b border-border mb-6'>
      <Tabs value={activeTab}>
        <TabsList variant='line' className='gap-6'>
          <TabsTrigger value='consultas' asChild>
            <Link to='/agenda/consultas' className='cursor-pointer'>
              Consultas
            </Link>
          </TabsTrigger>

          <TabsTrigger value='minha-disponibilidade' asChild>
            <Link to='/agenda/minha-disponibilidade' className='cursor-pointer'>
              Minha disponibilidade
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
