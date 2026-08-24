import { Icon } from '@/ui/shared/widgets/components/icon'
import { Textarea } from '@/ui/shadcn/textarea'
import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'

export type LawyerNotesSectionProps = {
  lawyerNotes: string
  setLawyerNotes: (val: string) => void
  isReadOnly?: boolean
}

export const LawyerNotesSection = ({
  lawyerNotes,
  setLawyerNotes,
  isReadOnly = false,
}: LawyerNotesSectionProps) => {
  return (
    <CollapsibleCard
      isOptional
      title={
        <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
          <Icon name='file-text' className='w-4 h-4 text-teal-800' /> Notas do advogado
        </h2>
      }
      contentClassName='space-y-3'
    >
      <Textarea
        value={lawyerNotes}
        readOnly={isReadOnly}
        onChange={(e) => setLawyerNotes(e.target.value)}
        placeholder='Opcional — anotações adicionais...'
        className='min-h-[80px] rounded-xl text-xs bg-slate-50/50'
      />
    </CollapsibleCard>
  )
}
