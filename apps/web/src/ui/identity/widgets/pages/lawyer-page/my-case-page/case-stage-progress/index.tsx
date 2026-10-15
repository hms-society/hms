import { getCaseStages } from '../case-page-data'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type CaseStageProgressProps = { caseStatus?: string; isClosureActive?: boolean }

export const CaseStageProgress = ({
  caseStatus,
  isClosureActive = false,
}: CaseStageProgressProps) => {
  const stages = getCaseStages(caseStatus, isClosureActive)

  return (
    <div className='mt-5 flex w-full flex-wrap items-center gap-x-5 gap-y-3 overflow-hidden border-t border-border pt-4'>
      {stages.map((stage, index) => (
        <div key={stage.label} className='flex min-w-fit items-center'>
          <div
            className={`flex items-center gap-2 text-[14px] font-semibold ${stage.isActive ? 'text-primary' : 'text-muted-foreground opacity-60'}`}
          >
            <div
              className={`flex size-8 items-center justify-center rounded-full ${stage.isActive ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'}`}
            >
              <Icon name={stage.icon} className='size-3.5' />
            </div>
            <span className='flex flex-col'>
              {stage.label}
              {stage.status && (
                <span className='text-[14px] font-normal text-primary/70'>
                  {stage.status}
                </span>
              )}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className='mx-2 hidden h-px w-10 bg-border lg:block' />
          )}
        </div>
      ))}
    </div>
  )
}
