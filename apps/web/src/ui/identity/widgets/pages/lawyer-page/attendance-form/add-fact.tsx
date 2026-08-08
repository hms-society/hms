import { useState } from 'react'
import { X, Plus, Calendar } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'

interface AddFactDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (fact: { date: string; description: string; status: string }) => void
}

export function AddFactDialog({ isOpen, onClose, onAdd }: AddFactDialogProps) {
  const [dateType, setDateType] = useState<'specific' | 'period' | 'undefined'>('specific')
  const [dateValue, setDateValue] = useState('')
  const [description, setDescription] = useState('')
  const [probationaryStatus, setProbationaryStatus] = useState('A comprovar')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!description.trim()) return
    onAdd({
      date: dateValue || (dateType === 'undefined' ? 'Indefinida' : '—'),
      description,
      status: probationaryStatus,
    })
    setDescription('')
    setDateValue('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-serif">Adicionar fato</h3>
            <p className="text-xs text-slate-500">Registro cronológico com situação probatória</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Data ou período *</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setDateType('specific')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                dateType === 'specific' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Data específica
            </button>
            <button
              type="button"
              onClick={() => setDateType('period')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                dateType === 'period' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Período
            </button>
            <button
              type="button"
              onClick={() => setDateType('undefined')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                dateType === 'undefined' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Indefinida
            </button>
          </div>

          {dateType !== 'undefined' && (
            <div className="relative mt-2">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                placeholder={dateType === 'specific' ? '20/03/2026' : '2020–2026'}
                className="pl-9 h-9 rounded-xl text-xs"
              />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Descrição do fato *</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o fato de forma objetiva"
            className="h-9 rounded-xl text-xs"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Situação probatória *</label>
          <div className="flex items-center gap-2">
            {['Comprovado', 'A comprovar', 'Controvertido'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setProbationaryStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full h-9 text-xs px-5 border-slate-200 text-slate-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-teal-800 hover:bg-teal-900 text-white rounded-full h-9 text-xs px-5 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar fato
          </Button>
        </div>
      </div>
    </div>
  )
}