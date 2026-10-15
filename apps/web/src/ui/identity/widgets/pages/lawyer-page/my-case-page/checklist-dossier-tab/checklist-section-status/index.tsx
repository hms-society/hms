import type { CHECKLIST_SECTION_STATUSES } from '../checklist-section-statuses'
import { Badge } from '@/ui/shadcn/badge'

export type ChecklistSectionStatusProps = {
  status: (typeof CHECKLIST_SECTION_STATUSES)[keyof typeof CHECKLIST_SECTION_STATUSES]
}

export const ChecklistSectionStatus = ({ status }: ChecklistSectionStatusProps) => (
  <div className='flex flex-wrap items-center gap-2'>
    <h2 className='font-serif text-lg font-semibold text-foreground'>
      Checklist Documental
    </h2>
    <Badge variant={status.variant} className='h-6 rounded-full px-3 text-[12px]'>
      {status.label}
    </Badge>
  </div>
)
