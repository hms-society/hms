import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { LawyerCaseHeaderActions } from '../lawyer-case-header-actions'
import { CaseStageProgress } from '../case-stage-progress'
import { CaseSummaryFacts } from '../case-summary-facts'
import { getCaseStatusLabel } from '../case-page-data'

export type LawyerCaseHeaderProps = {
  title: string
  publicCode: string
  legalArea: string
  clientName: string
  team: readonly { collaboratorId: string; name: string }[]
  isGeneratingPortalLink: boolean
  onOpenPortal: () => void
  dossierApproved: boolean
  caseStatus?: string
  onOpenNewPiece: () => void
}

export const LawyerCaseHeader = (props: LawyerCaseHeaderProps) => (
  <section className='rounded-lg border border-border bg-secondary px-5 py-4 shadow-xs'>
    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
      <div className='flex min-w-0 flex-col gap-1.5'>
        <div className='flex flex-wrap items-center gap-2'>
          <h1 className='font-serif text-2xl font-semibold text-foreground'>
            {props.title}
          </h1>
          <Badge
            variant={
              props.caseStatus === LegalCaseStatus.Documentation
                ? 'attention'
                : 'secondary'
            }
            className='h-6 rounded-full px-3 text-[12px]'
          >
            <span className='size-1.5 rounded-full bg-brand-accent' />
            {getCaseStatusLabel(props.caseStatus)}
          </Badge>
        </div>
        <CaseSummaryFacts
          publicCode={props.publicCode}
          legalArea={props.legalArea}
          clientName={props.clientName}
        />
      </div>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <div className='mr-1 flex items-center'>
          <div className='flex -space-x-1.5'>
            {props.team.map((member) => (
              <Avatar
                key={member.collaboratorId}
                className='size-8 border-2 border-secondary'
              >
                <AvatarFallback className='bg-teal-700 text-white text-[12px]'>
                  {member.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className='ml-3 text-[14px] font-medium text-muted-foreground'>
            Equipe do caso
          </span>
        </div>
        <LawyerCaseHeaderActions
          isGeneratingPortalLink={props.isGeneratingPortalLink}
          onOpenPortal={props.onOpenPortal}
          dossierApproved={props.dossierApproved}
          onOpenNewPiece={props.onOpenNewPiece}
        />
      </div>
    </div>
    <CaseStageProgress caseStatus={props.caseStatus} />
  </section>
)
