import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type TabItemProps = {
  icon: Extract<
    IconName,
    'briefcase-business' | 'clipboard-list' | 'history' | 'shield-check' | 'user'
  >
  label: string
  active?: boolean
}

export const TabItem = ({ icon, label, active = false }: TabItemProps) => {
  return (
    <span
      className={`flex items-center gap-2 border-b-2 px-1 pb-2 text-xs font-semibold whitespace-nowrap ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={icon} className='size-4' />
      {label}
    </span>
  )
}
