import { Button } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  useDynamicFormActions,
  type DynamicFormActionsProps,
} from './use-dynamic-form-actions'

export type { DynamicFormActionsProps }

export const DynamicFormActions = (props: DynamicFormActionsProps) => {
  const {
    triggerRef,
    isOpen,
    handleOpenChange,
    handleDuplicate,
    handleChangeAvailability,
    handleDelete,
    availabilityLabel,
  } = useDynamicFormActions(props)

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant='ghost'
          size='icon-sm'
          aria-label={`Ações de ${props.form.name}`}
        >
          <Icon name='ellipsis' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        aria-label={`Ações de ${props.form.name}`}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          triggerRef.current?.focus()
        }}
      >
        <DropdownMenuItem onSelect={handleDuplicate}>
          Duplicar formulário
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleChangeAvailability}>
          {availabilityLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onSelect={handleDelete}
        >
          Excluir formulário
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
