import type { ConsultationDocumentSelectionOption } from '@hms/core/consultation/domain/structures'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useDocumentCatalogQuery } from '@/ui/document-production/hooks/use-document-catalog-query'
import { useDocumentTopicsQuery } from '@/ui/document-production/hooks/use-document-topics-query'
import { cn } from '@/ui/shadcn/utils'

export type SelectFormalizationDocumentsDialogProps = {
  open: boolean
  options: readonly ConsultationDocumentSelectionOption[]
  selectedDocumentSpecificationIds: readonly string[]
  isLoading?: boolean
  isSaving?: boolean
  isReadOnly?: boolean
  initialAreaId?: string
  initialTopicId?: string
  onOpenChange: (open: boolean) => void
  onSave: (documentSpecificationIds: readonly string[]) => void
}

export function SelectFormalizationDocumentsDialog({
  open,
  options,
  selectedDocumentSpecificationIds,
  isLoading = false,
  isSaving = false,
  isReadOnly = false,
  initialAreaId,
  initialTopicId,
  onOpenChange,
  onSave,
}: SelectFormalizationDocumentsDialogProps) {
  const [search, setSearch] = useState('')
  const [areaId, setAreaId] = useState('all')
  const [topicId, setTopicId] = useState('all')
  const [draftSelection, setDraftSelection] = useState<Set<string>>(new Set())
  const { areas } = useDocumentCatalogQuery()
  const topics = useDocumentTopicsQuery(areaId === 'all' ? null : areaId)
  const selectedDocumentSpecificationIdSet = useMemo(
    () => new Set(selectedDocumentSpecificationIds),
    [selectedDocumentSpecificationIds],
  )

  const lockedDocumentSpecificationIds = useMemo(
    () =>
      new Set(
        options
          .filter((option) => option.selected && option.hasVersion)
          .map((option) => option.documentSpecificationId),
      ),
    [options],
  )

  useEffect(() => {
    if (!open) return
    setDraftSelection(new Set(selectedDocumentSpecificationIds))
    setSearch('')
    setAreaId(initialAreaId ?? 'all')
    setTopicId(initialTopicId ?? 'all')
  }, [initialAreaId, initialTopicId, open, selectedDocumentSpecificationIds])

  const newDocumentSpecificationCount = useMemo(
    () =>
      [...draftSelection].filter((id) => !selectedDocumentSpecificationIdSet.has(id))
        .length,
    [draftSelection, selectedDocumentSpecificationIdSet],
  )

  const hasSelectionChanges = useMemo(() => {
    if (draftSelection.size !== selectedDocumentSpecificationIdSet.size) return true
    return [...draftSelection].some((id) => !selectedDocumentSpecificationIdSet.has(id))
  }, [draftSelection, selectedDocumentSpecificationIdSet])

  const selectionActionLabel =
    newDocumentSpecificationCount > 0
      ? `Adicionar ${newDocumentSpecificationCount} ${newDocumentSpecificationCount === 1 ? 'documento' : 'documentos'}`
      : hasSelectionChanges
        ? 'Salvar seleção'
        : 'Adicionar 0 documentos'

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return options.filter((option) => {
      const matchesSearch =
        !normalizedSearch ||
        `${option.name} ${option.description}`
          .toLocaleLowerCase()
          .includes(normalizedSearch)
      if (!matchesSearch) return false
      if (option.application.scope === 'global')
        return areaId === 'all' && topicId === 'all'
      const matchesArea =
        areaId === 'all' || option.application.legalAreaIds.includes(areaId)
      const matchesTopic =
        topicId === 'all' ||
        option.application.legalTopicIdsByArea[areaId]?.includes(topicId) === true
      return matchesArea && matchesTopic
    })
  }, [areaId, options, search, topicId])

  function toggleSelection(id: string, checked: boolean | 'indeterminate') {
    if (lockedDocumentSpecificationIds.has(id)) return

    setDraftSelection((current) => {
      const next = new Set(current)
      if (checked === true) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='min-w-0 max-h-[calc(100vh-1.5rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-muted/60'>
        <DialogHeader className='min-w-0 border-b border-border px-6 py-5 pr-16'>
          <DialogTitle className='text-2xl font-semibold'>
            Selecionar documentos
          </DialogTitle>
          <DialogDescription>
            Escolha um ou mais modelos para adicionar à formalização.
          </DialogDescription>
        </DialogHeader>

        <div className='min-w-0 space-y-4 px-6 py-5'>
          <div className='relative'>
            <Icon
              name='search'
              className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              aria-label='Buscar documentos'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Buscar documento pelo nome'
              className='h-11 pl-10'
              readOnly={isReadOnly}
            />
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label
                className='text-sm font-semibold'
                htmlFor='formalization-area-filter'
              >
                Área jurídica
              </label>
              <Select
                value={areaId}
                onValueChange={(value) => {
                  setAreaId(value)
                  setTopicId('all')
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger
                  id='formalization-area-filter'
                  aria-label='Área jurídica'
                  className='w-full'
                >
                  <span className='flex items-center gap-2'>
                    <Icon name='scale' className='size-4 text-muted-foreground' />
                    <SelectValue placeholder='Todas as áreas' />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas as áreas</SelectItem>
                  {(areas.data ?? []).map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1.5'>
              <label
                className='text-sm font-semibold'
                htmlFor='formalization-topic-filter'
              >
                Tema jurídico
              </label>
              <Select
                value={topicId}
                onValueChange={setTopicId}
                disabled={isReadOnly || areaId === 'all'}
              >
                <SelectTrigger
                  id='formalization-topic-filter'
                  aria-label='Tema jurídico'
                  className='w-full'
                >
                  <span className='flex items-center gap-2'>
                    <Icon name='tag' className='size-4 text-muted-foreground' />
                    <SelectValue placeholder='Todos os temas' />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os temas</SelectItem>
                  {topics.data.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center justify-between gap-3'>
            <span className='text-base font-semibold'>Modelos disponíveis</span>
            <span className='text-sm text-muted-foreground'>
              {newDocumentSpecificationCount}{' '}
              {newDocumentSpecificationCount === 1 ? 'selecionado' : 'selecionados'}
            </span>
          </div>

          <div className='max-h-80 overflow-y-auto rounded-xl border border-border'>
            {isLoading ? (
              <p className='p-6 text-center text-sm text-muted-foreground'>
                Carregando modelos...
              </p>
            ) : filteredOptions.length === 0 ? (
              <p className='p-6 text-center text-sm text-muted-foreground'>
                Nenhum modelo encontrado.
              </p>
            ) : (
              filteredOptions.map((option, index) => {
                const isLocked = lockedDocumentSpecificationIds.has(
                  option.documentSpecificationId,
                )
                const isSelected = draftSelection.has(option.documentSpecificationId)

                return (
                  <div
                    key={option.documentSpecificationId}
                    className={cn(
                      'flex min-w-0 flex-wrap items-start gap-3 px-4 py-3 transition-colors',
                      index > 0 && 'border-t border-border',
                      isLocked
                        ? 'bg-muted/50 text-muted-foreground'
                        : 'hover:bg-muted/40',
                    )}
                  >
                    <Checkbox
                      id={`formalization-document-${option.documentSpecificationId}`}
                      checked={isSelected}
                      disabled={isReadOnly || isLocked}
                      onCheckedChange={(checked) =>
                        toggleSelection(option.documentSpecificationId, checked)
                      }
                      aria-label={`Selecionar ${option.name}`}
                      className='mt-2.5 size-5 rounded-md'
                    />
                    <div className='flex min-w-0 flex-1 flex-wrap items-start gap-3 sm:flex-nowrap'>
                      <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                        <Icon name='file-text' className='size-5' />
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span
                          className={cn(
                            'block text-base font-medium',
                            isLocked && 'text-muted-foreground',
                          )}
                        >
                          {option.name}
                        </span>
                        <span className='mt-0.5 block text-sm text-muted-foreground'>
                          {option.description ||
                            'Modelo disponível para produção documental.'}
                        </span>
                      </span>
                      {isLocked && (
                        <span className='mt-0.5 inline-flex w-full items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground sm:ml-auto sm:w-auto'>
                          <Icon name='check' className='size-3.5' />
                          Já adicionado
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter className='-mx-0 -mb-0 min-w-0 flex-col-reverse items-stretch justify-between px-6 py-4 sm:flex-row sm:items-center'>
          <span className='min-w-0 text-sm text-muted-foreground'>
            {newDocumentSpecificationCount}{' '}
            {newDocumentSpecificationCount === 1
              ? 'documento selecionado'
              : 'documentos selecionados'}
          </span>
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='rounded-full'
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              variant='default'
              size='sm'
              className='rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90'
              onClick={() => onSave([...draftSelection])}
              disabled={isReadOnly || isSaving || !hasSelectionChanges}
              aria-busy={isSaving}
            >
              <Icon name='plus' />
              {isSaving ? 'Adicionando...' : selectionActionLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
