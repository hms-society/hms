import { Icon } from '@/ui/shared/widgets/components/icon'
import { Textarea } from '@/ui/shadcn/textarea'

interface LawyerNotesSectionProps {
  lawyerNotes: string
  setLawyerNotes: (val: string) => void
}

export function LawyerNotesSection({
  lawyerNotes,
  setLawyerNotes,
}: LawyerNotesSectionProps) {
  return (
    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-3'>
      <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
        <Icon name='file-text' className='w-4 h-4 text-teal-800' /> Notas do advogado
      </h2>
      <Textarea
        value={lawyerNotes}
        onChange={(e) => setLawyerNotes(e.target.value)}
        placeholder='Opcional — anotações adicionais...'
        className='min-h-[80px] rounded-xl text-xs bg-slate-50/50'
      />
    </div>
  )
}
