import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export interface FormOption {
  id: string
  title: string
  area?: string
  theme?: string
  legalAreaId?: string
  legalTopicId?: string
}

interface LegalAreaOption {
  id: string
  name: string
}

interface LegalTopicOption {
  id: string
  legalAreaId?: string
  name: string
}

interface SelectFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (form: FormOption) => void
}

const AVAILABLE_FORMS: FormOption[] = []

export function SelectFormDialog({ isOpen, onClose, onSelect }: SelectFormDialogProps) {
  const { legalCatalogService } = useRestContext()

  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const { data: areasData } = useQuery({
    queryKey: ['legal-areas'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()

      if (response.isFailure) return []

      return (response.body as LegalAreaOption[]) ?? []
    },
    enabled: isOpen,
  })

  const { data: topicsData } = useQuery({
    queryKey: ['legal-topics', selectedArea],
    queryFn: async () => {
      if (!selectedArea) return []

      const response = await legalCatalogService.listLegalTopics(selectedArea)

      if (response.isFailure) return []

      return (response.body as LegalTopicOption[]) ?? []
    },
    enabled: isOpen && Boolean(selectedArea),
  })

  if (!isOpen) return null

  const areas = areasData ?? []
  const topics = topicsData ?? []

  const filteredForms = AVAILABLE_FORMS.filter((form) => {
    const matchesSearch = form.title.toLowerCase().includes(search.toLowerCase())
    const matchesArea = !selectedArea || form.legalAreaId === selectedArea
    const matchesTheme = !selectedTheme || form.legalTopicId === selectedTheme

    return matchesSearch && matchesArea && matchesTheme
  })

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId)
    setSelectedTheme('')
    setSelectedId('')
  }

  const handleConfirm = () => {
    const found = AVAILABLE_FORMS.find((form) => form.id === selectedId)

    if (found) {
      onSelect(found)
    }

    onClose()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-base font-bold text-slate-800 font-serif'>
              Selecionar ficha de atendimento
            </h3>

            <p className='text-xs text-slate-500'>
              Filtre pelo contexto jurídico ou pesquise pelo nome da ficha.
            </p>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'
          >
            <Icon name='x' className='w-4 h-4' />
          </button>
        </div>

        <div className='space-y-1'>
          <label htmlFor='search-form' className='text-xs font-medium text-slate-700'>
            Buscar ficha
          </label>

          <div className='relative'>
            <Icon
              name='search'
              className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
            />

            <Input
              id='search-form'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Digite o nome da ficha'
              className='pl-9 h-9 rounded-xl text-xs'
            />
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label htmlFor='select-area' className='text-xs font-medium text-slate-700'>
              Área jurídica
            </label>

            <select
              id='select-area'
              value={selectedArea}
              onChange={(e) => handleAreaChange(e.target.value)}
              className='mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700'
            >
              <option value=''>Todas as áreas</option>

              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor='select-theme' className='text-xs font-medium text-slate-700'>
              Tema jurídico
            </label>

            <select
              id='select-theme'
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              disabled={!selectedArea}
              className='mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400'
            >
              <option value=''>Todos os temas</option>

              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between text-xs text-slate-500'>
            <span className='font-medium text-slate-700'>Fichas encontradas</span>

            <span>{filteredForms.length} resultados</span>
          </div>

          <div className='space-y-2 max-h-56 overflow-y-auto pr-1'>
            {filteredForms.length === 0 ? (
              <div className='py-8 text-center text-xs text-slate-400'>
                Nenhuma ficha disponível.
              </div>
            ) : (
              filteredForms.map((item) => {
                const isSelected = selectedId === item.id

                return (
                  <button
                    type='button'
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`flex w-full text-left items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
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
                      {isSelected && <div className='w-2 h-2 rounded-full bg-white' />}
                    </div>

                    <Icon name='file-text' className='w-4 h-4 text-slate-400 shrink-0' />

                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold text-slate-800 truncate'>
                        {item.title}
                      </p>

                      <p className='text-[11px] text-slate-500'>
                        {item.area} · {item.theme}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-100'>
          <Button
            variant='outline'
            onClick={onClose}
            className='rounded-full h-9 text-xs px-5 border-slate-200 text-slate-600'
          >
            Cancelar
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!selectedId}
            className='bg-teal-800 hover:bg-teal-900 text-white rounded-full h-9 text-xs px-5 gap-1.5 disabled:opacity-50'
          >
            <Icon name='check' className='w-3.5 h-3.5' />
            Usar ficha
          </Button>
        </div>
      </div>
    </div>
  )
}
