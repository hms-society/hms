import type { LegalCaseSummary } from '@hms/core/case-management/domain/entities'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'

export type AdministratorCaseHeaderProps = {
  caseDetails?: LegalCaseSummary
  isLoading: boolean
}

export const AdministratorCaseHeader = ({
  caseDetails,
  isLoading,
}: AdministratorCaseHeaderProps) => (
  <section className='rounded-lg border border-border bg-secondary px-5 py-4 shadow-xs'>
    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
      <div className='flex min-w-0 flex-col gap-3'>
        <h1 className='font-serif text-2xl font-semibold text-foreground'>
          {caseDetails?.title ??
            (isLoading ? 'Carregando caso…' : 'Detalhes indisponíveis')}
        </h1>
        {caseDetails && (
          <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1.5'>
              <Icon name='tag' className='size-3.5' />
              {caseDetails.publicCode}
            </span>
            <span className='flex items-center gap-1.5'>
              <Icon name='scale' className='size-3.5' />
              {caseDetails.legalArea}
            </span>
            <span className='flex items-center gap-1.5'>
              <Icon name='user' className='size-3.5' />
              {caseDetails.clientName}
            </span>
            <span>Status: {caseDetails.status}</span>
          </div>
        )}
      </div>
      <section aria-label='Equipe do caso' className='flex items-center gap-3'>
        <div className='flex -space-x-1.5'>
          {caseDetails?.team.map((member) => (
            <Avatar
              key={member.collaboratorId}
              className='size-8 border-2 border-secondary'
            >
              <AvatarFallback className='rounded-full bg-secondary text-secondary-foreground text-xs'>
                {member.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </section>
    </div>
  </section>
)
