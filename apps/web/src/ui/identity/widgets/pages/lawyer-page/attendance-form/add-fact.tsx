import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { relevantFactSchema } from '@hms/validation/consultation'

export interface FactToEdit {
  id: string
  date: string
  description: string
  status: string
}

interface AddFactDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (fact: {
    id?: string
    date: string
    description: string
    status: string
  }) => void
  factToEdit?: FactToEdit | null
}

const MAX_DESCRIPTION_LENGTH = 1000

export function AddFactDialog({
  isOpen,
  onClose,
  onAdd,
  factToEdit,
}: AddFactDialogProps) {
  const [dateType, setDateType] = useState<'specific' | 'period' | 'undefined'>(
    'specific',
  )
  const [dateValue, setDateValue] = useState('')
  const [description, setDescription] = useState('')
  const [probationaryStatus, setProbationaryStatus] = useState('A comprovar')
  const [error, setError] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (factToEdit) {
      setDescription(factToEdit.description || '')
      setProbationaryStatus(factToEdit.status || 'A comprovar')

      if (!factToEdit.date || factToEdit.date === '—') {
        setDateType('specific')
        setDateValue('')
      } else if (factToEdit.date === 'Indefinida') {
        setDateType('undefined')
        setDateValue('')
      } else if (factToEdit.date.includes('/')) {
        setDateType('specific')
        const [day, month, year] = factToEdit.date.split('/')
        if (day && month && year) {
          setDateValue(`${year}-${month}-${day}`)
        } else {
          setDateValue(factToEdit.date)
        }
      } else {
        setDateType('period')
        setDateValue(factToEdit.date)
      }
    } else {
      setDateType('specific')
      setDateValue('')
      setDescription('')
      setProbationaryStatus('A comprovar')
    }
    setError('')
  }, [factToEdit])

  if (!isOpen) return null

  const formatDateDisplay = (value: string) => {
    if (!value) return dateType === 'undefined' ? 'Indefinida' : '—'

    if (dateType === 'specific' && value.includes('-')) {
      const [year, month, day] = value.split('-')
      return `${day}/${month}/${year}`
    }

    return value
  }

  const handleClose = () => {
    setError('')
    setDescription('')
    setDateValue('')
    onClose()
  }

  const handleSubmit = () => {
    const formattedDate = formatDateDisplay(dateValue)

    const result = relevantFactSchema.safeParse({
      description,
      date:
        formattedDate !== '—' && formattedDate !== 'Indefinida' ? formattedDate : null,
    })

    if (!result.success) {
      const fieldError = result.error.format().description?._errors[0]
      setError(fieldError || 'A descrição é obrigatória.')
      return
    }

    setError('')
    onAdd({
      id: factToEdit?.id,
      date: formattedDate,
      description: result.data.description,
      status: probationaryStatus,
    })

    setDescription('')
    setDateValue('')
    onClose()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-5'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-base font-bold text-slate-800 font-serif'>
              {factToEdit ? 'Editar fato' : 'Adicionar fato'}
            </h3>
            <p className='text-xs text-slate-500'>
              Registro cronológico com situação probatória
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

        <div className='space-y-2'>
          <p className='text-xs font-medium text-slate-700'>Data ou período</p>
          <div className='grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs'>
            <button
              type='button'
              onClick={() => {
                setDateType('specific')
                setDateValue('')
              }}
              className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                dateType === 'specific'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Data específica
            </button>
            <button
              type='button'
              onClick={() => {
                setDateType('period')
                setDateValue('')
              }}
              className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                dateType === 'period'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Período
            </button>
            <button
              type='button'
              onClick={() => {
                setDateType('undefined')
                setDateValue('')
              }}
              className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                dateType === 'undefined'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Indefinida
            </button>
          </div>

          {dateType !== 'undefined' && (
            <div className='relative mt-2'>
              {dateType === 'period' && (
                <Icon
                  name='calendar'
                  className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10'
                />
              )}
              <Input
                type={dateType === 'specific' ? 'date' : 'text'}
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                placeholder={dateType === 'period' ? '2020–2026' : undefined}
                className='h-9 rounded-xl text-xs px-3 border-[#d4ceca]'
              />
            </div>
          )}
        </div>

        <div className='space-y-1'>
          <div className='flex items-center justify-between'>
            <label
              htmlFor='fact-description'
              className='text-xs font-medium text-slate-700'
            >
              Descrição do fato <span className='text-rose-500'>*</span>
            </label>
            <span
              className={`text-[10px] font-medium ${
                description.length >= MAX_DESCRIPTION_LENGTH
                  ? 'text-rose-500 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
          <textarea
            id='fact-description'
            ref={textareaRef}
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            onChange={(e) => {
              setDescription(e.target.value)
              if (error) setError('')
            }}
            placeholder='Descreva o fato de forma objetiva'
            rows={1}
            className={`w-full min-h-[38px] p-2.5 rounded-xl text-xs border overflow-hidden transition-all focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-500 focus:ring-rose-500'
                : 'border-[#d4ceca] focus:border-slate-400 focus:ring-slate-400'
            }`}
          />
          {error && <p className='text-[11px] text-rose-500 font-medium'>{error}</p>}
        </div>

        <div className='space-y-2'>
          <p className='text-xs font-medium text-slate-700'>Situação probatória</p>
          <div className='flex items-center gap-2'>
            {['Comprovado', 'A comprovar', 'Controvertido'].map((status) => (
              <button
                key={status}
                type='button'
                onClick={() => setProbationaryStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  probationaryStatus === status
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
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
            {factToEdit ? 'Salvar alterações' : 'Adicionar fato'}
          </Button>
        </div>
      </div>
    </div>
  )
}
