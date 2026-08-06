import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type DocumentSpecificationsFilterSelectProps = {
  label: string
  value: string | null
  placeholder: string
  options: readonly { value: string; label: string }[]
  disabled?: boolean
  onChange: (value: string | null) => void
}

export const DocumentSpecificationsFilterSelect = ({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: DocumentSpecificationsFilterSelectProps) => (
  <div className='block min-w-0 space-y-1.5 text-[11px] font-bold'>
    <span className='block'>{label}</span>
    <Select
      value={value ?? 'all'}
      onValueChange={(selected) => onChange(selected === 'all' ? null : selected)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className='h-9 w-full rounded-md text-xs'>
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
