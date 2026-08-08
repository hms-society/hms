import { Scale } from 'lucide-react'
import { Input } from '@/ui/shadcn/input'
import { Textarea } from '@/ui/shadcn/textarea'

interface ConclusionSectionProps {
  mainLegalQuestion: string
  setMainLegalQuestion: (val: string) => void
  clientGuidance: string
  setClientGuidance: (val: string) => void
  viability: string
  setViability: (val: string) => void
  decision: string
  setDecision: (val: string) => void
}

const VIABILITY_OPTIONS = [
  'Viável',
  'Viável com ressalvas',
  'Depende de documentos',
  'Em análise complementar',
  'Inviável',
]

const DECISION_OPTIONS = [
  'Prosseguir para contratação',
  'Manter em avaliação',
  'Nova consulta',
  'Encerrar',
]

export function ConclusionSection(props: ConclusionSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
        <Scale className="w-4 h-4 text-teal-800" /> Conclusão da consulta
      </h2>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-700">Questão jurídica principal</label>
        <Input
          value={props.mainLegalQuestion}
          onChange={(e) => props.setMainLegalQuestion(e.target.value)}
          className="h-9 rounded-xl text-xs"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-700">Orientação prestada ao cliente</label>
        <Textarea
          value={props.clientGuidance}
          onChange={(e) => props.setClientGuidance(e.target.value)}
          placeholder="Registre o que foi orientado..."
          className="min-h-[70px] rounded-xl text-xs bg-slate-50/50"
        />
      </div>

      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Viabilidade Jurídica</label>
          <div className="flex flex-wrap gap-2">
            {VIABILITY_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => props.setViability(v)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  props.viability === v ? 'bg-teal-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Decisão de Encaminhamento</label>
          <div className="flex flex-wrap gap-2">
            {DECISION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => props.setDecision(d)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  props.decision === d ? 'bg-teal-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}