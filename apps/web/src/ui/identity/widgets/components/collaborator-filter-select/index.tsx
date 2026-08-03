import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type CollaboratorFilterSelectProps = {
  label: string
  value?: string
  placeholder: string
  options: { value: string; label: string }[]
  onValueChange: (value: string) => void
}

export function CollaboratorFilterSelect({
  label,
  value,
  placeholder,
  options,
  onValueChange,
}: CollaboratorFilterSelectProps) {
  return (
    <div className='space-y-2 text-sm font-medium'>
      <label htmlFor={label} className='block font-bold text-foreground'>
        {label}
      </label>
      <Select value={value ?? 'all'} onValueChange={onValueChange}>
        <SelectTrigger className='w-full' aria-label={label}>
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
}
