import { Clock, ChevronUp, Edit2, Trash2, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'

export interface TimelineFact {
  id: string
  date: string
  description: string
  status: string
  isSuggested?: boolean
}

interface TimelineSectionProps {
  facts: TimelineFact[]
  onRemoveFact: (id: string) => void
  onOpenAddModal: () => void
}

export function TimelineSection({ facts, onRemoveFact, onOpenAddModal }: TimelineSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
          <Clock className="w-4 h-4 text-teal-800" /> Fatos relevantes e cronologia
        </h2>
        <ChevronUp className="w-4 h-4 text-slate-400 cursor-pointer" />
      </div>

      <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
        {facts.map((fact) => (
          <div key={fact.id} className="flex items-center justify-between p-3 text-xs bg-white hover:bg-slate-50">
            <span className="font-medium text-slate-600 w-24 shrink-0">{fact.date}</span>
            <p className="text-slate-800 flex-1 px-3">{fact.description}</p>
            <div className="flex items-center gap-2">
              {fact.isSuggested && (
                <Badge className="bg-purple-100 text-purple-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sugerido
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 cursor-pointer">
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFact(fact.id)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onOpenAddModal}
        className="text-xs text-teal-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar fato manualmente
      </button>
    </div>
  )
}