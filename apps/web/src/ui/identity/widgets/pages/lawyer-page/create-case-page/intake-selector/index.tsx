import { Controller, type Control } from 'react-hook-form'
import type { IntakeListItem } from '@hms/core/intake/domain/structures'
import type { CreateCaseData } from '@hms/validation/case-management'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/ui/shadcn/command'
import { Input } from '@/ui/shadcn/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'

export type IntakeSelectorProps = {
  control: Control<CreateCaseData>
  intakes: readonly IntakeListItem[]
  isLoading: boolean
  isOpen: boolean
  search: string
  onOpenChange: (open: boolean) => void
  onSearchChange: (search: string) => void
  onSelectIntake: (intakeId: string, onChange: (value: string) => void) => void
}

export const IntakeSelector = (props: IntakeSelectorProps) => (
  <Controller
    control={props.control}
    name='intakeId'
    render={({ field }) => {
      const selected = props.intakes.find((intake) => intake.intakeId === field.value)
      return (
        <Popover open={props.isOpen} onOpenChange={props.onOpenChange}>
          <PopoverTrigger asChild>
            <div className='relative w-full cursor-pointer'>
              <Input
                placeholder='Digite o nome do cliente, CPF ou ID da triagem...'
                value={
                  props.isOpen
                    ? props.search
                    : selected
                      ? `Triagem #${selected.displayId} - ${selected.client.name}`
                      : props.search
                }
                onChange={(event) => {
                  if (selected && !props.isOpen) field.onChange('')
                  props.onSearchChange(event.target.value)
                  props.onOpenChange(true)
                }}
                onClick={() => props.onOpenChange(true)}
                className='h-11 rounded-xl shadow-sm pr-10 cursor-pointer'
                readOnly={!props.isOpen && Boolean(selected)}
              />
              <Icon
                name='search'
                className='absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground'
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className='w-[var(--radix-popover-trigger-width)] p-0 rounded-xl'
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <Command>
              <CommandList>
                <CommandEmpty>
                  {props.isLoading
                    ? 'Buscando...'
                    : 'Nenhuma triagem contratada encontrada.'}
                </CommandEmpty>
                <CommandGroup>
                  {props.intakes.map((intake) => (
                    <CommandItem
                      key={intake.intakeId}
                      value={`${intake.displayId} ${intake.client.maskedTaxId} ${intake.client.name}`}
                      onSelect={() => {
                        props.onSelectIntake(intake.intakeId, field.onChange)
                        props.onSearchChange('')
                        props.onOpenChange(false)
                      }}
                    >
                      <Icon
                        name='check'
                        className={`mr-2 size-4 ${field.value === intake.intakeId ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <span className='text-muted-foreground text-xs mr-2'>
                        {intake.displayId}
                      </span>
                      <span className='truncate'>{intake.client.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )
    }}
  />
)
