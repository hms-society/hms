import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'

export type TimelineFact = {
  id: string
  date: string
  description: string
  status: string
}

export type TimelineSectionProps = {
  facts: TimelineFact[]
  onRemoveFact: (id: string) => void
  onEditFact: (fact: TimelineFact) => void
  onOpenAddModal: () => void
  isReadOnly?: boolean
}

export const TimelineSection = ({
  facts,
  onRemoveFact,
  onEditFact,
  onOpenAddModal,
  isReadOnly = false,
}: TimelineSectionProps) => {
  return (
    <CollapsibleCard
      isOptional
      title={
        <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
          <Icon name='history' className='w-4 h-4 text-teal-800' />
          Fatos relevantes e cronologia
        </h2>
      }
    >
      {facts.length === 0 ? (
        <p className='text-xs text-slate-400 py-2'>Nenhum fato registrado</p>
      ) : (
        <div className='space-y-3'>
          {facts.map((fact) => (
            <div
              key={fact.id}
              className='flex items-start justify-between gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100'
            >
              <div className='flex items-start gap-3 flex-1 min-w-0'>
                <span className='text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0'>
                  {fact.date}
                </span>
                <p className='text-xs text-slate-700 whitespace-pre-wrap break-words flex-1 leading-relaxed pt-0.5'>
                  {fact.description}
                </p>
              </div>

              {!isReadOnly && (
                <div className='flex items-center gap-2 shrink-0'>
                  <Badge
                    className={`text-[10px] font-medium border-none px-2.5 py-0.5 rounded-full ${
                      fact.status === 'Comprovado'
                        ? 'bg-emerald-100/80 text-emerald-800'
                        : fact.status === 'Controvertido'
                          ? 'bg-rose-100/80 text-rose-800'
                          : 'bg-amber-100/80 text-amber-800'
                    }`}
                  >
                    {fact.status}
                  </Badge>
                  <button
                    type='button'
                    onClick={() => onEditFact(fact)}
                    className='text-slate-400 hover:text-slate-600 cursor-pointer p-1'
                  >
                    <Icon name='pencil' className='w-3.5 h-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => onRemoveFact(fact.id)}
                    className='text-slate-400 hover:text-rose-600 cursor-pointer p-1'
                  >
                    <Icon name='trash-2' className='w-3.5 h-3.5' />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <Button
          type='button'
          variant='ghost'
          onClick={onOpenAddModal}
          className='text-teal-800 hover:text-teal-900 hover:bg-teal-50 text-xs font-bold gap-1.5 p-0 h-auto cursor-pointer'
        >
          <Icon name='plus' className='w-4 h-4' /> Adicionar fato manualmente
        </Button>
      )}
    </CollapsibleCard>
  )
}
