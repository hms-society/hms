import { useState, useRef, useEffect } from 'react'
import {
  ConsultationDecision,
  ConsultationViability,
} from '@hms/core/consultation/domain/structures'
import {
  CONSULTATION_VIABILITY_OPTIONS,
  getConsultationDecisionViabilityError,
} from '@hms/validation/consultation'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Input } from '@/ui/shadcn/input'
import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'

export type ConclusionSectionProps = {
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
  viabilityErrorMessage?: string
  decisionErrorMessage?: string
  isReadOnly?: boolean
}

const MAX_GUIDANCE_LENGTH = 2000
const FRONTEND_DECISION_OPTIONS = [
  ConsultationDecision.ProceedToContracting,
  ConsultationDecision.CloseWithoutContract,
] as const

export const ConclusionSection = (props: ConclusionSectionProps) => {
  const [questionTouched, setQuestionTouched] = useState(false)
  const [guidanceTouched, setGuidanceTouched] = useState(false)
  const [viabilityTouched, setViabilityTouched] = useState(false)
  const [decisionTouched, setDecisionTouched] = useState(false)
  const isReadOnly = props.isReadOnly ?? false

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  const isQuestionEmpty = !props.mainLegalQuestion?.trim()
  const showQuestionError = props.errorMessage || (questionTouched && isQuestionEmpty)

  const isGuidanceEmpty = !props.clientGuidance?.trim()
  const showGuidanceError =
    props.guidanceErrorMessage || (guidanceTouched && isGuidanceEmpty)
  const decisionViabilityError = getConsultationDecisionViabilityError(
    props.viability,
    props.decision,
  )
  const showViabilityError =
    props.viabilityErrorMessage ||
    decisionViabilityError ||
    (viabilityTouched && !props.viability)
  const showDecisionError =
    props.decisionErrorMessage || (decisionTouched && !props.decision)
  const isDecisionDisabled =
    isReadOnly || props.viability === ConsultationViability.NotViable

  return (
    <CollapsibleCard
      title={
        <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
          <Icon name='scale' className='w-4 h-4 text-teal-800' /> Conclusão da consulta
        </h2>
      }
      contentClassName='space-y-5'
    >
      <div className='space-y-1'>
        <label
          htmlFor='main-legal-question'
          className='text-xs font-medium text-slate-700'
        >
          Questão jurídica principal <span className='text-rose-500'>*</span>
        </label>
        <Input
          id='main-legal-question'
          value={props.mainLegalQuestion}
          readOnly={isReadOnly}
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
          <label htmlFor='client-guidance' className='text-xs font-medium text-slate-700'>
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
          id='client-guidance'
          ref={textareaRef}
          value={props.clientGuidance}
          readOnly={isReadOnly}
          maxLength={MAX_GUIDANCE_LENGTH}
          onBlur={() => setGuidanceTouched(true)}
          onChange={(e) => {
            props.setClientGuidance(e.target.value)
            if (!guidanceTouched) setGuidanceTouched(true)
          }}
          placeholder='Registre o que foi orientado...'
          rows={3}
          className='w-full min-h-[70px] p-2.5 rounded-xl text-xs border border-[#d4ceca] overflow-hidden transition-all focus:outline-none focus:ring-2 focus:border-ring focus:ring-ring/20 bg-slate-50/50 read-only:bg-transparent read-only:border-border read-only:text-muted-foreground resize-none'
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
          <p className='text-xs font-medium text-slate-700'>
            Viabilidade Jurídica <span className='text-rose-500'>*</span>
          </p>
          <div className='flex flex-wrap gap-2'>
            {CONSULTATION_VIABILITY_OPTIONS.map((v) => (
              <button
                key={v}
                type='button'
                onClick={() => {
                  props.setViability(v)
                  setViabilityTouched(true)
                }}
                disabled={isReadOnly}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  props.viability === v
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600'
                }`}
                aria-pressed={props.viability === v}
              >
                {v}
              </button>
            ))}
          </div>
          {showViabilityError && (
            <p className='text-[11px] font-medium text-rose-500'>
              {props.viabilityErrorMessage ||
                decisionViabilityError ||
                'A viabilidade jurídica é obrigatória.'}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <p className='text-xs font-medium text-slate-700'>
            Decisão de Encaminhamento <span className='text-rose-500'>*</span>
          </p>
          <div className='flex flex-wrap gap-2'>
            {FRONTEND_DECISION_OPTIONS.map((d) => (
              <button
                key={d}
                type='button'
                onClick={() => {
                  props.setDecision(d)
                  setDecisionTouched(true)
                }}
                disabled={isDecisionDisabled}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  props.decision === d
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600'
                }`}
                aria-pressed={props.decision === d}
              >
                {d}
              </button>
            ))}
          </div>
          {showDecisionError && (
            <p className='text-[11px] font-medium text-rose-500'>
              {props.decisionErrorMessage || 'A decisão de encaminhamento é obrigatória.'}
            </p>
          )}
        </div>
      </div>
    </CollapsibleCard>
  )
}
