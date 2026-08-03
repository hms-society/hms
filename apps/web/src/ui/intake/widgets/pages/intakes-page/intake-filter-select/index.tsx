import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { IconName } from '@/ui/shared/widgets/components/icon/types/icon-name'

export type IntakeFilterSelectProps = {
  disabled?: boolean
  icon?: IconName
  label: string
  options: readonly { value: string; label: string }[]
  placeholder: string
  value?: string | null
  onChange: (value: string | null) => void
}

export const IntakeFilterSelect = ({
  disabled,
  icon,
  label,
  options,
  placeholder,
  value,
  onChange,
}: IntakeFilterSelectProps) => (
  <div className='space-y-2'>
    <span className='block text-[11px] font-bold text-foreground'>{label}</span>
    <Select
      value={value ?? 'all'}
      onValueChange={(selectedValue) =>
        onChange(selectedValue === 'all' ? null : selectedValue)
      }
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        className='h-[38px] w-full rounded-full px-3 text-xs'
      >
        {icon && <Icon name={icon} className='size-3.5 text-muted-foreground' />}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)
