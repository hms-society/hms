import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useSelectForm, type FormOption } from './use-select-form'

export type { FormOption } from './use-select-form'

export type SelectFormDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (form: FormOption) => void
  initialLegalAreaId?: string
  initialLegalTopicId?: string
  initialSelectedFormId?: string
  contextType?: string
}

export const SelectFormDialog = ({
  isOpen,
  onClose,
  onSelect,
  initialLegalAreaId,
  initialLegalTopicId,
  initialSelectedFormId,
  contextType,
}: SelectFormDialogProps) => {
  const {
    areas,
    forms,
    handleAreaChange,
    handleConfirm,
    handleSelectForm,
    handleThemeChange,
    isFormsError,
    isFormsLoading,
    search,
    selectedArea,
    selectedId,
    selectedTheme,
    setSearch,
    topics,
  } = useSelectForm({
    isOpen,
    initialLegalAreaId,
    initialLegalTopicId,
    initialSelectedFormId,
    contextType,
  })

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-base font-bold text-slate-800 font-serif'>
              Selecionar ficha dinâmica
            </h3>

            <p className='text-xs text-slate-500'>
              Filtre pelo contexto jurídico ou pesquise pelo nome da ficha dinâmica.
            </p>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'
            aria-label='Fechar seleção de ficha dinâmica'
          >
            <Icon name='x' className='w-4 h-4' />
          </button>
        </div>

        <div className='space-y-1'>
          <label htmlFor='search-form' className='text-xs font-medium text-slate-700'>
            Buscar ficha dinâmica
          </label>

          <div className='relative'>
            <Icon
              name='search'
              className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
            />

            <Input
              id='search-form'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Digite o nome da ficha dinâmica'
              className='pl-9 h-9 rounded-xl text-xs'
            />
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label htmlFor='select-area' className='text-xs font-medium text-slate-700'>
              Área jurídica
            </label>

            <Select value={selectedArea} onValueChange={handleAreaChange}>
              <SelectTrigger
                id='select-area'
                className='mt-1 w-full rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700'
                size='sm'
              >
                <SelectValue placeholder='Todas as áreas' />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor='select-theme' className='text-xs font-medium text-slate-700'>
              Tema jurídico
            </label>

            <Select
              value={selectedTheme}
              onValueChange={handleThemeChange}
              disabled={!selectedArea}
            >
              <SelectTrigger
                id='select-theme'
                className='mt-1 w-full rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700'
                size='sm'
              >
                <SelectValue placeholder='Todos os temas' />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between text-xs text-slate-500'>
            <span className='font-medium text-slate-700'>
              Fichas dinâmicas encontradas
            </span>

            <span>{forms.length} resultados</span>
          </div>

          <div className='space-y-2 max-h-56 overflow-y-auto pr-1'>
            {isFormsLoading ? (
              <div className='py-8 text-center text-xs text-slate-400'>
                Carregando fichas dinâmicas...
              </div>
            ) : isFormsError ? (
              <div className='py-8 text-center text-xs text-destructive'>
                Não foi possível carregar as fichas dinâmicas.
              </div>
            ) : forms.length === 0 ? (
              <div className='py-8 text-center text-xs text-slate-400'>
                Nenhuma ficha dinâmica disponível para este contexto.
              </div>
            ) : (
              forms.map((item) => {
                const isSelected = selectedId === item.id

                return (
                  <button
                    type='button'
                    key={item.id}
                    onClick={() => handleSelectForm(item.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full text-left items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary/60 bg-highlight/60'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className='w-2 h-2 rounded-full bg-primary-foreground' />
                      )}
                    </div>

                    <Icon name='file-text' className='w-4 h-4 text-slate-400 shrink-0' />

                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold text-slate-800 truncate'>
                        {item.title}
                      </p>

                      <p className='text-[11px] text-slate-500'>
                        {item.area ?? 'Área não informada'}
                        {item.theme ? ` · ${item.theme}` : ''}
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
            onClick={() => handleConfirm(onSelect, onClose)}
            disabled={!selectedId || isFormsLoading || isFormsError}
            className='bg-teal-800 hover:bg-teal-900 text-white rounded-full h-9 text-xs px-5 gap-1.5 disabled:opacity-50'
          >
            <Icon name='check' className='w-3.5 h-3.5' />
            Usar ficha dinâmica
          </Button>
        </div>
      </div>
    </div>
  )
}
