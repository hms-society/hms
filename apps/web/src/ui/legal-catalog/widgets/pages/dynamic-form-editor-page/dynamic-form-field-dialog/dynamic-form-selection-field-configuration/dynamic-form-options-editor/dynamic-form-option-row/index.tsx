import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DynamicFormOptionRowProps } from './types'
import { useDynamicFormOptionRow } from './use-dynamic-form-option-row'

export const DynamicFormOptionRow = (props: DynamicFormOptionRowProps) => {
  const {
    attributes,
    isFirst,
    isLast,
    isDragging,
    listeners,
    moveDown,
    moveUp,
    remove,
    setActivatorNodeRef,
    setNodeRef,
    style,
    toggleDefault,
    updateLabel,
  } = useDynamicFormOptionRow(props)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? 'z-10 shadow-lg' : ''}`}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            size='icon-xs'
            variant='ghost'
            className='cursor-grab text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'
            aria-label={`Reordenar opção ${props.index + 1}`}
            aria-roledescription='controle de reordenação'
            aria-keyshortcuts='Space ArrowUp ArrowDown'
          >
            <Icon name='list-search' className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>Arrastar para reordenar</TooltipContent>
      </Tooltip>
      <Input
        value={props.option.label}
        disabled={props.isDisabled}
        aria-label={`Rótulo da opção ${props.index + 1}`}
        aria-invalid={Boolean(props.error)}
        aria-describedby={props.error ? `${props.option.clientId}-error` : undefined}
        onChange={(event) => updateLabel(event.target.value)}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            size='icon-xs'
            variant={props.isDefault ? 'default' : 'outline'}
            disabled={props.isDisabled}
            aria-label={`Usar opção ${props.index + 1} como padrão`}
            aria-pressed={props.isDefault}
            onClick={toggleDefault}
          >
            <Icon name='check' className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>Definir como resposta inicial</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            size='icon-xs'
            variant='ghost'
            disabled={props.isDisabled || isFirst}
            aria-label={`Mover opção ${props.index + 1} para cima`}
            onClick={moveUp}
          >
            <Icon name='arrow-up' className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>Mover para cima</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            size='icon-xs'
            variant='ghost'
            disabled={props.isDisabled || isLast}
            aria-label={`Mover opção ${props.index + 1} para baixo`}
            onClick={moveDown}
          >
            <Icon name='arrow-down' className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>Mover para baixo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            size='icon-xs'
            variant='ghost'
            disabled={props.isDisabled || props.count <= 1}
            aria-label={`Remover opção ${props.index + 1}`}
            onClick={remove}
          >
            <Icon name='trash-2' className='size-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top'>Remover opção</TooltipContent>
      </Tooltip>
      {props.error && (
        <span id={`${props.option.clientId}-error`} className='sr-only'>
          {props.error.message}
        </span>
      )}
    </li>
  )
}
