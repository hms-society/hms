import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { legalClaimSchema } from '@hms/validation/consultation'

export interface ClaimToEdit {
  id: string
  title: string
  summary: string
}

interface AddClaimDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (claim: { id?: string; title: string; summary: string }) => void
  claimToEdit?: ClaimToEdit | null
}

const MAX_SUMMARY_LENGTH = 1000

export function AddClaimDialog({
  isOpen,
  onClose,
  onAdd,
  claimToEdit,
}: AddClaimDialogProps) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: summary is needed to resize the textarea when its content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [summary])

  useEffect(() => {
    if (claimToEdit) {
      setTitle(claimToEdit.title || '')
      setSummary(claimToEdit.summary || '')
    } else {
      setTitle('')
      setSummary('')
    }
    setError('')
  }, [claimToEdit])

  if (!isOpen) return null

  const handleClose = () => {
    setError('')
    setTitle('')
    setSummary('')
    onClose()
  }

  const handleSubmit = () => {
    const result = legalClaimSchema.safeParse({ title, summary })

    if (!result.success) {
      const fieldError = result.error.format().title?._errors[0]
      setError(fieldError || 'O título do pedido é obrigatório.')
      return
    }

    setError('')
    onAdd({
      id: claimToEdit?.id,
      title: result.data.title,
      summary: summary || '',
    })

    setTitle('')
    setSummary('')
    onClose()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-5'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-base font-bold text-slate-800 font-serif'>
              {claimToEdit ? 'Editar pedido jurídico' : 'Adicionar pedido jurídico'}
            </h3>
            <p className='text-xs text-slate-500'>
              Registre a pretensão ou pedido para a consulta
            </p>
          </div>
          <button
            type='button'
            onClick={handleClose}
            className='text-slate-400 hover:text-slate-600 cursor-pointer'
          >
            <Icon name='x' className='w-4 h-4' />
          </button>
        </div>

        <div className='space-y-1'>
          <label 
            htmlFor='claim-title' 
            className='text-xs font-medium text-slate-700'
            >
            Título do pedido <span className='text-rose-500'>*</span>
          </label>
          <Input
            id='claim-title'
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError('')
            }}
            placeholder='Ex: Rescisão indireta do contrato de trabalho'
            className={`h-9 rounded-xl text-xs ${
              error ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-[#d4ceca]'
            }`}
          />
          {error && <p className='text-[11px] text-rose-500 font-medium'>{error}</p>}
        </div>

        <div className='space-y-1'>
          <div className='flex items-center justify-between'>
            <label htmlFor='claim-summary' className='text-xs font-medium text-slate-700'>
              Resumo/Fundamentação
            </label>
            <span
              className={`text-[10px] font-medium ${
                summary.length >= MAX_SUMMARY_LENGTH
                  ? 'text-rose-500 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {summary.length}/{MAX_SUMMARY_LENGTH}
            </span>
          </div>
          <textarea
            id='claim-summary'
            ref={textareaRef}
            value={summary}
            maxLength={MAX_SUMMARY_LENGTH}
            onChange={(e) => setSummary(e.target.value)}
            placeholder='Breve justificativa do pedido'
            rows={1}
            className='w-full min-h-[38px] p-2.5 rounded-xl text-xs border border-[#d4ceca] overflow-hidden transition-all focus:outline-none focus:ring-2 focus:border-slate-400 focus:ring-slate-400 bg-white resize-none'
          />
        </div>

        <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-100'>
          <Button
            variant='outline'
            onClick={handleClose}
            className='rounded-full h-9 text-xs px-5 border-slate-200 text-slate-600 cursor-pointer'
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className='bg-teal-800 hover:bg-teal-900 text-white rounded-full h-9 text-xs px-5 gap-1.5 cursor-pointer'
          >
            <Icon name='plus' className='w-3.5 h-3.5' />{' '}
            {claimToEdit ? 'Salvar alterações' : 'Adicionar pedido'}
          </Button>
        </div>
      </div>
    </div>
  )
}
