import { Icon } from '@/ui/shared/widgets/components/icon'

export type CaseSummaryFactsProps = {
  publicCode: string
  legalArea: string
  clientName: string
}

export const CaseSummaryFacts = ({
  publicCode,
  legalArea,
  clientName,
}: CaseSummaryFactsProps) => (
  <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted-foreground'>
    <span className='flex items-center gap-1.5'>
      <Icon name='tag' className='size-3.5' />
      {publicCode}
    </span>
    <span className='flex items-center gap-1.5'>
      <Icon name='scale' className='size-3.5' />
      {legalArea}
    </span>
    <span className='flex items-center gap-1.5'>
      <Icon name='user' className='size-3.5' />
      {clientName}
    </span>
    <span className='flex items-center gap-1.5'>
      <Icon name='alert-circle' className='size-3.5' />
      Prioridade: Normal
    </span>
  </div>
)
