import { Switch } from '@/ui/shadcn/switch'

export type SwitchFieldProps = {
  checked: boolean
  disabled?: boolean
  offLabel: string
  onLabel: string
  label: string
  onToggle: () => void
}

export const SwitchField = ({
  checked,
  disabled,
  label,
  offLabel,
  onLabel,
  onToggle,
}: SwitchFieldProps) => (
  <div className='flex h-10 w-full items-center gap-2 rounded-lg border border-input px-3 text-left text-sm'>
    <Switch
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onCheckedChange={onToggle}
      className='h-5 w-9 [&>span]:size-4 [&>span[data-state=checked]]:translate-x-4'
    />
    {checked ? onLabel : offLabel}
  </div>
)
