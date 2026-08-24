import { Card } from '@/ui/shadcn/card'
import type { Intake } from '@hms/core/intake/domain/entities'
import { CaseActionType } from '../case-action-type'
import { CaseCardFooter } from './case-card-footer'
import { CasePendencyBadge } from './case-pendency-badge'
import { useCaseCard } from './use-case-card'

export type CaseCardProps = {
  intake: Intake
}

export const CaseCard = ({ intake }: CaseCardProps) => {
  const { handleNavigate, hasPendency } = useCaseCard(intake)

  return (
    <Card className='group flex flex-col justify-between p-6 h-56 border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-pointer'>
      <div className='flex justify-between items-start w-full'>
        <span className='font-extralight text-sm tracking-wider text-muted-foreground'>
          Caso #{intake.sequenceNumber}
        </span>
        <CasePendencyBadge hasPendency={hasPendency} />
      </div>

      <div className='flex flex-col gap-1 my-3'>
        <h3 className='font- text-2xl font-medium text-foreground group-hover:text-primary transition-colors duration-200'>
          <CaseActionType areaId={intake.legalAreaId} />
        </h3>
        <span className='font-light text-sm tracking-wider text-muted-foreground'>
          Notas:
          {intake.demandNotes}
        </span>
      </div>

      <CaseCardFooter status={intake.status} onNavigate={handleNavigate} />
    </Card>
  )
}
