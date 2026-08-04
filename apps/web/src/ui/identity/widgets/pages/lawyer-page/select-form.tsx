import { useState } from 'react'
import { X, Search, FileText, Check } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'

interface FormOption {
  id: string
  title: string
  area: string
  theme: string
}

interface SelectFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (form: FormOption) => void
}

const AVAILABLE_FORMS: FormOption[] = [
  {
    id: '1',
    title: 'Triagem trabalhista inicial',
    area: 'Trabalhista',
    theme: 'Verbas rescisórias',
  },
  {
    id: '2',
    title: 'Entrevista inicial trabalhista',
    area: 'Trabalhista',
    theme: 'Relação de emprego',
  },
  {
    id: '3',
    title: 'Triagem previdenciária inicial',
    area: 'Previdenciário',
    theme: 'Aposentadoria por idade',
  },
]

export function SelectFormDialog({ isOpen, onClose, onSelect }: SelectFormDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('Todas as áreas')
  const [selectedTheme, setSelectedTheme] = useState('Todos os temas')
  const [selectedId, setSelectedId] = useState('1')

  if (!isOpen) return null

  const filteredForms = AVAILABLE_FORMS.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase())
    const matchesArea = selectedArea === 'Todas as áreas' || f.area === selectedArea
    const matchesTheme = selectedTheme === 'Todos os temas' || f.theme === selectedTheme
    return matchesSearch && matchesArea && matchesTheme
  })

  const handleConfirm = () => {
    const found = AVAILABLE_FORMS.find((f) => f.id === selectedId)
    if (found) onSelect(found)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-serif">
              Selecionar ficha de atendimento
            </h3>
            <p className="text-xs text-slate-500">
              Filtre pelo contexto jurídico ou pesquise pelo nome da ficha.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Busca */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Buscar ficha</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite o nome da ficha"
              className="pl-9 h-9 rounded-xl text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700">Área jurídica</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700"
            >
              <option>Todas as áreas</option>
              <option>Trabalhista</option>
              <option>Previdenciário</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Tema jurídico</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700"
            >
              <option>Todos os temas</option>
              <option>Verbas rescisórias</option>
              <option>Relação de emprego</option>
              <option>Aposentadoria por idade</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700">Fichas encontradas</span>
            <span>{filteredForms.length} resultados</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredForms.map((item) => {
              const isSelected = selectedId === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-700 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.area} · {item.theme}
                    </p>
                  </div>
                </div>
              )
            })}
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
            onClick={handleConfirm}
            className="bg-teal-800 hover:bg-teal-900 text-white rounded-full h-9 text-xs px-5 gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Usar ficha
          </Button>
        </div>
      </div>
    </div>
  )
}