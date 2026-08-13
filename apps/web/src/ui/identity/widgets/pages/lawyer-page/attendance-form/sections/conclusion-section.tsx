import { useState, useRef, useEffect } from 'react'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Input } from '@/ui/shadcn/input'

interface ConclusionSectionProps {
  mainLegalQuestion: string
  setMainLegalQuestion: (val: string) => void
  clientGuidance: string
  setClientGuidance: (val: string) => void
  viability: string
  setViability: (val: string) => void
  decision: string
  setDecision: (val: string) => void
  errorMessage?: string
  guidanceErrorMessage?: string
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

const MAX_GUIDANCE_LENGTH = 2000

export function ConclusionSection(props: ConclusionSectionProps) {
  const [questionTouched, setQuestionTouched] = useState(false)
  const [guidanceTouched, setGuidanceTouched] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [props.clientGuidance])

  const isQuestionEmpty = !props.mainLegalQuestion || !props.mainLegalQuestion.trim()
  const showQuestionError = props.errorMessage || (questionTouched && isQuestionEmpty)

  const isGuidanceEmpty = !props.clientGuidance || !props.clientGuidance.trim()
  const showGuidanceError =
    props.guidanceErrorMessage || (guidanceTouched && isGuidanceEmpty)

  return (
    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5'>
      <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
        <Icon name='scale' className='w-4 h-4 text-teal-800' /> Conclusão da consulta
      </h2>

      <div className='space-y-1'>
        <label className='text-xs font-medium text-slate-700'>
          Questão jurídica principal <span className='text-rose-500'>*</span>
        </label>
        <Input
          value={props.mainLegalQuestion}
          onBlur={() => setQuestionTouched(true)}
          onChange={(e) => {
            props.setMainLegalQuestion(e.target.value)
            if (!questionTouched) setQuestionTouched(true)
          }}
          placeholder='Descreva a principal dúvida ou demanda jurídica'
          className='h-9 rounded-xl text-xs border-[#d4ceca]'
        />
        {showQuestionError && (
          <p className='text-[11px] text-rose-500 font-medium pt-0.5'>
            {props.errorMessage || 'A questão jurídica principal é obrigatória.'}
          </p>
        )}
      </div>

      <div className='space-y-1'>
        <div className='flex items-center justify-between'>
          <label className='text-xs font-medium text-slate-700'>
            Orientação prestada ao cliente <span className='text-rose-500'>*</span>
          </label>
          <span
            className={`text-[10px] font-medium ${
              props.clientGuidance.length >= MAX_GUIDANCE_LENGTH
                ? 'text-rose-500 font-bold'
                : 'text-slate-400'
            }`}
          >
            {props.clientGuidance.length}/{MAX_GUIDANCE_LENGTH}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={props.clientGuidance}
          maxLength={MAX_GUIDANCE_LENGTH}
          onBlur={() => setGuidanceTouched(true)}
          onChange={(e) => {
            props.setClientGuidance(e.target.value)
            if (!guidanceTouched) setGuidanceTouched(true)
          }}
          placeholder='Registre o que foi orientado...'
          rows={3}
          className='w-full min-h-[70px] p-2.5 rounded-xl text-xs border border-[#d4ceca] overflow-hidden transition-all focus:outline-none focus:ring-2 focus:border-slate-400 focus:ring-slate-400 bg-slate-50/50 resize-none'
        />
        {showGuidanceError && (
          <p className='text-[11px] text-rose-500 font-medium pt-0.5'>
            {props.guidanceErrorMessage ||
              'A orientação prestada ao cliente é obrigatória.'}
          </p>
        )}
      </div>

      <div className='space-y-4 pt-2 border-t border-slate-100'>
        <div className='space-y-2'>
          <label className='text-xs font-medium text-slate-700'>
            Viabilidade Jurídica
          </label>
          <div className='flex flex-wrap gap-2'>
            {VIABILITY_OPTIONS.map((v) => (
              <button
                key={v}
                type='button'
                onClick={() => props.setViability(v)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  props.viability === v
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <label className='text-xs font-medium text-slate-700'>
            Decisão de Encaminhamento
          </label>
          <div className='flex flex-wrap gap-2'>
            {DECISION_OPTIONS.map((d) => (
              <button
                key={d}
                type='button'
                onClick={() => props.setDecision(d)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  props.decision === d
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600'
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
