import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { TooltipProvider } from '@/ui/shadcn/tooltip'
import type { DynamicFormOptionsEditorProps } from './types'
import { DynamicFormOptionRow } from './dynamic-form-option-row'
import { useDynamicFormOptionsEditor } from './use-dynamic-form-options-editor'

export const DynamicFormOptionsEditor = (props: DynamicFormOptionsEditorProps) => {
  const {
    activeId,
    addOption,
    announcements,
    collisionDetection,
    onDragCancel,
    onDragEnd,
    onDragStart,
    removeOption,
    screenReaderInstructions,
    sensors,
    toggleDefault,
    updateLabel,
    moveOption,
  } = useDynamicFormOptionsEditor(props)

  return (
    <TooltipProvider delayDuration={0}>
      <fieldset
        className='space-y-2 rounded-lg border border-border bg-card p-3'
        aria-label='Opções do campo'
      >
        <legend className='px-1 text-xs font-medium'>Opções de resposta *</legend>
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          accessibility={{ announcements, screenReaderInstructions }}
          onDragStart={onDragStart}
          onDragCancel={onDragCancel}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={props.options.map((option) => option.clientId)}
            strategy={verticalListSortingStrategy}
          >
            <ol className='space-y-2' aria-label='Opções ordenadas'>
              {props.options.map((option, index) => (
                <DynamicFormOptionRow
                  key={option.clientId}
                  option={option}
                  index={index}
                  count={props.options.length}
                  error={props.errors.find(
                    (item) => item.optionClientId === option.clientId,
                  )}
                  isDefault={props.defaultOptionClientIds.includes(option.clientId)}
                  isDisabled={props.isDisabled}
                  onLabelChange={(label) => updateLabel(option.clientId, label)}
                  onToggleDefault={() => toggleDefault(option.clientId)}
                  onMove={(targetIndex) => moveOption(option.clientId, targetIndex)}
                  onRemove={() => removeOption(option.clientId)}
                />
              ))}
            </ol>
          </SortableContext>
          <div className='sr-only' aria-live='polite'>
            {activeId ? 'Reordenando opção' : ''}
          </div>
        </DndContext>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={props.isDisabled}
          onClick={addOption}
        >
          <Icon name='plus' /> Adicionar opção
        </Button>
      </fieldset>
    </TooltipProvider>
  )
}
