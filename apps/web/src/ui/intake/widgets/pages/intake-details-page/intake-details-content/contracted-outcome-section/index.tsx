import { Card, CardContent } from '@/ui/shadcn/card'

import { CaseSummaryCard } from './case-summary-card'
import { FormalizationCompletionCard } from './formalization-completion-card'
import {
  useContractedOutcomeSection,
  type ContractedOutcomeSectionProps,
} from './use-contracted-outcome-section'

export type { ContractedOutcomeSectionProps } from './use-contracted-outcome-section'

export const ContractedOutcomeSection = (props: ContractedOutcomeSectionProps) => {
  const {
    formalization,
    isCaseUnavailable,
    isFormalizationUnavailable,
    legalAreaName,
    legalCase,
    onRetryCase,
    onRetryFormalization,
    primaryLawyerName,
    sectionLabel,
  } = useContractedOutcomeSection(props)

  return (
    <section aria-labelledby='contracted-outcome-heading' className='space-y-4'>
      <div>
        <p className='text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
          {sectionLabel}
        </p>
        <h2
          id='contracted-outcome-heading'
          className='mt-1 font-serif text-2xl font-semibold text-brand'
        >
          Resultado da contratação
        </h2>
      </div>
      <Card className='border-0 bg-brand text-brand-foreground shadow-sm'>
        <CardContent className='flex items-center gap-3 p-4'>
          <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-foreground/10'>
            <span aria-hidden='true'>✓</span>
          </span>
          <p className='text-sm'>Este Intake está em estado terminal: contratado.</p>
        </CardContent>
      </Card>
      <div className='grid gap-4'>
        <FormalizationCompletionCard
          summary={formalization}
          isUnavailable={isFormalizationUnavailable}
          onRetry={onRetryFormalization}
        />
        <CaseSummaryCard
          legalCase={legalCase}
          legalAreaName={legalAreaName}
          primaryLawyerName={primaryLawyerName}
          isUnavailable={isCaseUnavailable}
          onRetry={onRetryCase}
        />
      </div>
    </section>
  )
}
