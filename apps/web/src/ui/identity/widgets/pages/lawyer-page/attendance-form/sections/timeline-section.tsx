import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'

export interface TimelineFact {
  id: string
  date: string
  description: string
  status: string
}

interface TimelineSectionProps {
  facts: TimelineFact[]
  onRemoveFact: (id: string) => void
  onEditFact: (fact: TimelineFact) => void
  onOpenAddModal: () => void
}

export function TimelineSection({
  facts,
  onRemoveFact,
  onEditFact,
  onOpenAddModal,
}: TimelineSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 font-serif">
          Fatos relevantes e cronologia
        </h2>
      </div>

      <div className="space-y-3">
        {facts.map((fact) => (
          <div
            key={fact.id}
            className="flex items-start justify-between gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                {fact.date}
              </span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap break-words flex-1 leading-relaxed pt-0.5">
                {fact.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                type="button"
                onClick={() => onEditFact(fact)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveFact(fact.id)}
                className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onOpenAddModal}
        className="text-teal-800 hover:text-teal-900 hover:bg-teal-50 text-xs font-bold gap-1.5 p-0 h-auto cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Adicionar fato manualmente
      </Button>
    </div>
  )
}