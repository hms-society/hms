import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type GateActionButtonProps = {
  destructive?: boolean
  disabled: boolean
  icon: 'shield-check' | 'lock' | 'shield-alert'
  label: string
  onClick: () => void
}

export const GateActionButton = ({
  destructive = false,
  disabled,
  icon,
  label,
  onClick,
}: GateActionButtonProps) => (
  <Button
    variant='outline'
    size='xs'
    className={
      destructive
        ? 'rounded-full border-destructive/20 bg-background text-destructive hover:bg-destructive/10'
        : 'rounded-full border-accent bg-background text-accent-foreground hover:bg-secondary'
    }
    disabled={disabled}
    onClick={onClick}
  >
    <Icon name={icon} className='size-3' />
    {label}
  </Button>
)
