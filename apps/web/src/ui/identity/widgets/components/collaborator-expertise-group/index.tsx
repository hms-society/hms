import React, { useEffect, useState } from 'react'
import { useWatch, type Control } from 'react-hook-form'

import { useCollaboratorLegalTopicsQuery } from './use-collaborator-legal-topics-query'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Label } from '@/ui/shadcn/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type CollaboratorFormValues = {
  email?: string
  professionalName: string
  jobTitle?: string
  profile: string
  legalExpertises?: { legalAreaId: string; legalTopicIds: string[] }[]
}

export type FieldProps = {
  label: string
  error?: string
  children: React.ReactNode
  id?: string
}

export function Field({ label, error, children, id: customId }: FieldProps) {
  const id = customId ?? label.toLowerCase().replaceAll(' ', '-')
  let hasClonedChild = false
  const fieldChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child) || hasClonedChild) return child

    hasClonedChild = true
    return React.cloneElement(
      child as React.ReactElement<{ id?: string; 'aria-describedby'?: string }>,
      { id, 'aria-describedby': error ? `${id}-error` : undefined },
    )
  })

  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      {fieldChildren}
      {error && (
        <p id={`${id}-error`} className='text-xs text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}

export type ExpertiseGroupProps = {
  control: Control<CollaboratorFormValues>
  index: number
  legalAreas: { id: string; name: string }[]
  selectedAreaIds: string[]
  disabled: boolean
  canRemove: boolean
  onRemove: () => void
  onAreaChange: (value: string) => void
  onTopicsChange: (topicIds: string[]) => void
  areaError?: string
  topicError?: string
  onAvailabilityChange: (index: number, unavailable: boolean) => void
}

export function ExpertiseGroup({
  control,
  index,
  legalAreas,
  selectedAreaIds,
  disabled,
  canRemove,
  onRemove,
  onAreaChange,
  onTopicsChange,
  areaError,
  topicError,
  onAvailabilityChange,
}: ExpertiseGroupProps) {
  const [isTopicsOpen, setIsTopicsOpen] = useState(false)
  const expertise = useWatch({ control, name: `legalExpertises.${index}` })
  const areaId = expertise?.legalAreaId
  const topicIds = expertise?.legalTopicIds ?? []
  const {
    legalTopics = [],
    legalTopicsError,
    isLoadingLegalTopics,
  } = useCollaboratorLegalTopicsQuery(areaId || undefined)
  const availableAreas = legalAreas.filter(
    (area) => area.id === areaId || !selectedAreaIds.includes(area.id),
  )
  const selectedTopics = legalTopics.filter((topic) => topicIds.includes(topic.id))

  useEffect(() => {
    setIsTopicsOpen(false)
    onAvailabilityChange(
      index,
      Boolean(areaId && (isLoadingLegalTopics || legalTopicsError)),
    )
  }, [areaId, index, isLoadingLegalTopics, legalTopicsError, onAvailabilityChange])

  function handleTopicToggle(topicId: string, checked: boolean) {
    const nextTopicIds = checked
      ? [...topicIds, topicId]
      : topicIds.filter((id) => id !== topicId)

    onTopicsChange(nextTopicIds)
  }

  function handleTopicsTriggerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return

    event.preventDefault()
    setIsTopicsOpen(true)
  }

  return (
    <div className='space-y-3'>
      <div className='grid gap-3 sm:grid-cols-[185px_minmax(0,1fr)] sm:items-start'>
        <div className='space-y-2'>
          <Label htmlFor={`legal-area-${index}`}>
            Área jurídica <span aria-hidden='true'>*</span>
          </Label>
          <Select value={areaId ?? ''} onValueChange={onAreaChange}>
            <SelectTrigger
              id={`legal-area-${index}`}
              size='sm'
              className='w-full px-3 text-[13px]'
              aria-label={`Área jurídica ${index + 1}`}
              disabled={disabled}
            >
              <SelectValue placeholder='Selecione uma área' />
            </SelectTrigger>
            <SelectContent>
              {availableAreas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {areaError && (
            <p role='alert' className='text-xs text-destructive'>
              {areaError}
            </p>
          )}
        </div>
        <div className='min-w-0 space-y-2'>
          <Label htmlFor={`legal-topics-${index}`}>
            Temas jurídicos <span aria-hidden='true'>* · múltipla seleção</span>
          </Label>
          <Popover open={isTopicsOpen} onOpenChange={setIsTopicsOpen}>
            <PopoverTrigger asChild>
              <div
                id={`legal-topics-${index}`}
                role='combobox'
                tabIndex={disabled || !areaId ? -1 : 0}
                aria-label={`Temas jurídicos da área ${index + 1}`}
                aria-expanded={isTopicsOpen}
                aria-controls={`legal-topics-options-${index}`}
                aria-disabled={disabled || !areaId}
                onKeyDown={handleTopicsTriggerKeyDown}
                className='flex h-9 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md border border-input bg-transparent px-2.5 py-1.5 text-[13px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50'
              >
                <div className='flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden'>
                  {selectedTopics.slice(0, 2).map((topic) => (
                    <Badge
                      key={topic.id}
                      variant='secondary'
                      className='max-w-[45%] shrink-0 bg-highlight px-2 text-[11px] text-highlight-foreground'
                    >
                      <span className='truncate'>{topic.name}</span>
                      <button
                        type='button'
                        aria-label={`Remover tema ${topic.name}`}
                        className='rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        onClick={(event) => {
                          event.stopPropagation()
                          handleTopicToggle(topic.id, false)
                        }}
                      >
                        <Icon name='x' className='size-3' />
                      </button>
                    </Badge>
                  ))}
                  {selectedTopics.length > 2 && (
                    <Badge
                      variant='outline'
                      className='px-2 text-[11px]'
                      aria-label={`${selectedTopics.length - 2} temas adicionais selecionados`}
                    >
                      +{selectedTopics.length - 2}
                    </Badge>
                  )}
                  {selectedTopics.length === 0 && (
                    <span className='text-muted-foreground'>Selecione os temas</span>
                  )}
                </div>
                <span className='flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground'>
                  {selectedTopics.length > 0 && (
                    <span>
                      {selectedTopics.length} selecionado
                      {selectedTopics.length === 1 ? '' : 's'}
                    </span>
                  )}
                  <Icon name='chevron-right' className='size-4 rotate-90' />
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent
              id={`legal-topics-options-${index}`}
              align='start'
              className='w-[var(--radix-popover-trigger-width)] min-w-[240px] p-2'
            >
              {isLoadingLegalTopics && (
                <p role='status' className='px-2 py-1 text-xs text-muted-foreground'>
                  Carregando temas jurídicos…
                </p>
              )}
              {legalTopicsError && (
                <p role='alert' className='px-2 py-1 text-xs text-destructive'>
                  Não foi possível carregar os temas jurídicos.
                </p>
              )}
              {!isLoadingLegalTopics && !legalTopicsError && legalTopics.length === 0 && (
                <p className='px-2 py-1 text-xs text-muted-foreground'>
                  Nenhum tema encontrado.
                </p>
              )}
              {!isLoadingLegalTopics && !legalTopicsError && legalTopics.length > 0 && (
                <div className='grid gap-1'>
                  {legalTopics.map((topic) => (
                    <label
                      key={topic.id}
                      htmlFor={`legal-topic-${topic.id}`}
                      className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted'
                    >
                      <Checkbox
                        id={`legal-topic-${topic.id}`}
                        aria-label={topic.name}
                        checked={topicIds.includes(topic.id)}
                        onCheckedChange={(checked) =>
                          handleTopicToggle(topic.id, checked === true)
                        }
                      />
                      <span>{topic.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
          {topicError && (
            <p role='alert' className='text-xs text-destructive'>
              {topicError}
            </p>
          )}
        </div>
      </div>
      {canRemove && areaId && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onRemove}
          disabled={disabled}
          className='h-auto justify-start px-2 py-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground'
        >
          Remover área
        </Button>
      )}
    </div>
  )
}
