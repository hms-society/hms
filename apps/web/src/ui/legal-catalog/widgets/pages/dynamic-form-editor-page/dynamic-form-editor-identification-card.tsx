import { useState, type KeyboardEvent } from 'react'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Switch } from '@/ui/shadcn/switch'
import { Textarea } from '@/ui/shadcn/textarea'
import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DynamicFormEditorPageController } from './use-dynamic-form-editor-page'
import type { DynamicFormEditorPageProps } from './types'

export function DynamicFormEditorIdentificationCard({
  props,
  controller,
}: {
  props: DynamicFormEditorPageProps
  controller: DynamicFormEditorPageController
}) {
  const { draft } = controller
  const form = controller.detailQuery.data?.form
  const areas = controller.areasQuery.data ?? []
  const topics = controller.topicsQuery.data ?? []
  const selectedTopics = topics.filter((topic) => draft.legalTopicIds.includes(topic.id))
  const [topicsOpen, setTopicsOpen] = useState(false)
  const canToggleAvailability =
    props.mode === 'edit' && !controller.isDirty && !controller.availabilityPending

  function toggleTopic(topicId: string) {
    const nextTopicIds = draft.legalTopicIds.includes(topicId)
      ? draft.legalTopicIds.filter((id) => id !== topicId)
      : [...draft.legalTopicIds, topicId]
    controller.updateDraft('legalTopicIds', nextTopicIds)
  }

  function handleTopicsTriggerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return

    event.preventDefault()
    setTopicsOpen(true)
  }

  return (
    <Card className='border border-border shadow-2xs'>
      <CardHeader className='flex-col items-start justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center'>
        <div className='flex min-w-0 items-center gap-2'>
          <Icon name='info' className='size-4 text-muted-foreground' />
          <h2 className='text-sm font-semibold'>Identificação e aplicabilidade</h2>
        </div>
        <div className='flex w-full items-center justify-end gap-3 text-sm sm:w-auto'>
          <Label
            htmlFor='dynamic-form-availability'
            className='font-normal whitespace-nowrap'
          >
            Disponível para seleção
          </Label>
          <Switch
            id='dynamic-form-availability'
            checked={form?.status === 'available'}
            disabled={!canToggleAvailability}
            onCheckedChange={() => void controller.toggleAvailability()}
            aria-label='Disponível para seleção'
          />
        </div>
      </CardHeader>
      <CardContent className='grid gap-4 px-5 py-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='dynamic-form-name'>Nome do formulário *</Label>
          <Input
            id='dynamic-form-name'
            value={draft.name}
            onChange={(event) => controller.updateDraft('name', event.target.value)}
            placeholder='Ex.: Triagem inicial'
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='dynamic-form-stage'>Etapa *</Label>
          <Select
            value={draft.stage}
            onValueChange={(value) =>
              controller.updateDraft('stage', value as typeof draft.stage)
            }
            disabled={props.mode === 'edit' && Boolean(form)}
          >
            <SelectTrigger id='dynamic-form-stage' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='consultation'>Consulta</SelectItem>
              <SelectItem value='formalization'>Formalização</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.8fr)]'>
          <div className='space-y-1.5'>
            <Label htmlFor='dynamic-form-legal-area'>Área jurídica *</Label>
            <Select
              value={draft.legalAreaId}
              onValueChange={(value) => {
                controller.updateDraft('legalAreaId', value)
                controller.updateDraft('legalTopicIds', [])
              }}
            >
              <SelectTrigger id='dynamic-form-legal-area' className='w-full'>
                <SelectValue placeholder='Selecione uma área' />
              </SelectTrigger>
              <SelectContent>
                {areas
                  .filter((area) => area.active || area.id === draft.legalAreaId)
                  .map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                      {!area.active ? ' (inativa)' : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='dynamic-form-topics'>Temas jurídicos *</Label>
            <Popover open={topicsOpen} onOpenChange={setTopicsOpen}>
              <PopoverTrigger asChild>
                <div
                  id='dynamic-form-topics'
                  role='combobox'
                  tabIndex={
                    !draft.legalAreaId || controller.topicsQuery.isPending ? -1 : 0
                  }
                  aria-label='Temas jurídicos'
                  aria-expanded={topicsOpen}
                  aria-disabled={!draft.legalAreaId || controller.topicsQuery.isPending}
                  onKeyDown={handleTopicsTriggerKeyDown}
                  className='flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 aria-disabled:pointer-events-none aria-disabled:opacity-50'
                >
                  <span className='flex min-w-0 flex-1 flex-wrap items-center gap-1'>
                    {selectedTopics.slice(0, 2).map((topic) => (
                      <Badge
                        key={topic.id}
                        variant='secondary'
                        className='max-w-[46%] rounded-full bg-highlight px-2 text-xs text-highlight-foreground'
                      >
                        <span className='truncate'>{topic.name}</span>
                        <button
                          type='button'
                          aria-label={`Remover tema ${topic.name}`}
                          className='rounded-full focus-visible:ring-2 focus-visible:ring-ring'
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleTopic(topic.id)
                          }}
                        >
                          <Icon name='x' className='size-3' />
                        </button>
                      </Badge>
                    ))}
                    {selectedTopics.length > 2 && (
                      <Badge variant='outline' className='rounded-full px-2 text-xs'>
                        +{selectedTopics.length - 2}
                      </Badge>
                    )}
                    {selectedTopics.length === 0 && (
                      <span className='text-muted-foreground'>Selecione os temas</span>
                    )}
                  </span>
                  <Icon
                    name='chevron-down'
                    className='size-4 shrink-0 text-muted-foreground'
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                align='start'
                className='w-[var(--radix-popover-trigger-width)] p-2'
              >
                <fieldset className='max-h-56 space-y-1 overflow-y-auto'>
                  <legend className='sr-only'>Opções de temas jurídicos</legend>
                  {topics
                    .filter(
                      (topic) => topic.active || draft.legalTopicIds.includes(topic.id),
                    )
                    .map((topic) => (
                      <label
                        key={topic.id}
                        htmlFor={`dynamic-form-topic-${topic.id}`}
                        className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted'
                      >
                        <Checkbox
                          id={`dynamic-form-topic-${topic.id}`}
                          checked={draft.legalTopicIds.includes(topic.id)}
                          onCheckedChange={() => toggleTopic(topic.id)}
                        />
                        <span>
                          {topic.name}
                          {!topic.active ? ' (inativo)' : ''}
                        </span>
                      </label>
                    ))}
                </fieldset>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='dynamic-form-description'>Quando sugerir este formulário</Label>
          <Textarea
            id='dynamic-form-description'
            value={draft.description}
            onChange={(event) =>
              controller.updateDraft('description', event.target.value)
            }
            placeholder='Descreva quando esta ficha deve ser sugerida.'
          />
        </div>
      </CardContent>
    </Card>
  )
}
