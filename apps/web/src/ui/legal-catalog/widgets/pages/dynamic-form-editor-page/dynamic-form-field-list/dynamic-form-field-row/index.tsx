import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { cn } from '@/ui/shadcn/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DynamicFormFieldRowProps } from './types'
import { useDynamicFormFieldRow } from './use-dynamic-form-field-row'

const TYPE_LABELS: Record<string, string> = {
  short_text: 'Texto curto',
  long_text: 'Texto longo',
  date: 'Data',
  boolean: 'Sim/Não',
  single_selection: 'Seleção única',
  multiple_selection: 'Múltipla escolha',
  integer: 'Número inteiro',
  currency: 'Moeda (BRL)',
  percentage: 'Percentual',
}

const TYPE_VARIANTS: Record<
  string,
  'info' | 'success' | 'attention' | 'waiting' | 'secondary'
> = {
  short_text: 'secondary',
  long_text: 'success',
  date: 'info',
  boolean: 'info',
  single_selection: 'waiting',
  multiple_selection: 'attention',
  integer: 'secondary',
  currency: 'secondary',
  percentage: 'attention',
}

export function DynamicFormFieldRow(props: DynamicFormFieldRowProps) {
  const controller = useDynamicFormFieldRow(props)
  return (
    <li
      ref={controller.setNodeRef}
      style={controller.style}
      className={cn(
        'border-b border-border py-3 last:border-b-0',
        controller.isDragging && 'relative z-10 bg-card shadow-sm',
      )}
    >
      <div className='flex flex-wrap items-center gap-3'>
        <button
          type='button'
          ref={controller.setActivatorNodeRef}
          {...controller.attributes}
          {...controller.listeners}
          className='mt-1 cursor-grab rounded p-1 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'
          aria-label={`Reordenar campo ${props.field.label}`}
          aria-roledescription='controle de reordenação'
          aria-keyshortcuts='Space ArrowUp ArrowDown'
        >
          <Icon name='grip-vertical' className='size-5' />
        </button>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='font-medium'>{props.field.label || 'Campo sem nome'}</h3>
            {props.field.required && (
              <Badge variant='attention' className='rounded-full px-2'>
                Obrigatório
              </Badge>
            )}
          </div>
          {(props.field.description || !props.field.key) && (
            <p className='mt-1 text-xs text-muted-foreground'>
              {props.field.description ?? 'Campo novo'}
            </p>
          )}
        </div>
        <div className='flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto'>
          <Badge
            variant={TYPE_VARIANTS[props.field.type] ?? 'secondary'}
            className={cn(
              'rounded-full px-2',
              (props.field.type === 'short_text' || props.field.type === 'currency') &&
                'border-transparent bg-highlight text-highlight-foreground',
            )}
          >
            {TYPE_LABELS[props.field.type]}
          </Badge>
          <Button
            type='button'
            size='sm'
            variant='brand'
            className='rounded-full'
            onClick={props.onEdit}
            aria-label={`Editar campo ${props.field.label}`}
          >
            <Icon name='pencil' /> Editar
          </Button>
          <Button
            type='button'
            size='icon-sm'
            variant='ghost'
            onClick={props.onRemove}
            aria-label={`Remover campo ${props.field.label}`}
          >
            <Icon name='trash-2' />
          </Button>
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              size='icon-xs'
              variant='ghost'
              disabled={controller.isFirst}
              onClick={controller.moveUp}
              aria-label={`Mover ${props.field.label} para cima`}
            >
              <Icon name='arrow-up' />
            </Button>
            <Button
              type='button'
              size='icon-xs'
              variant='ghost'
              disabled={controller.isLast}
              onClick={controller.moveDown}
              aria-label={`Mover ${props.field.label} para baixo`}
            >
              <Icon name='arrow-down' />
            </Button>
          </div>
        </div>
      </div>
    </li>
  )
}
