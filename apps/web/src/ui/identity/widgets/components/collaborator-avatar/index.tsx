import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { cn } from '@/ui/shadcn/utils/index.ts'

const AVATAR_COLORS = [
  'bg-brand text-brand-foreground',
  'bg-primary text-primary-foreground',
  'bg-brand-accent text-brand-accent-foreground',
  'bg-highlight-vivid text-brand-foreground',
  'bg-accent text-accent-foreground',
  'bg-secondary text-secondary-foreground',
] as const

export type CollaboratorAvatarProps = {
  name: string
  colorSeed?: string
  className?: string
}

function getInitials(name: string) {
  const nameParts = name.trim().split(/\s+/).filter(Boolean)

  if (nameParts.length === 0) return '?'
  if (nameParts.length === 1) return nameParts[0].slice(0, 2).toUpperCase()

  return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
}

function getColorIndex(name: string) {
  const hash = Array.from(name.trim()).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    7,
  )

  return hash % AVATAR_COLORS.length
}

export const CollaboratorAvatar = ({
  name,
  colorSeed,
  className,
}: CollaboratorAvatarProps) => {
  const colorClassName = AVATAR_COLORS[getColorIndex(colorSeed ?? name)]

  return (
    <Avatar
      size='lg'
      aria-hidden='true'
      className={cn('font-semibold', colorClassName, className)}
    >
      <AvatarFallback className={cn('text-sm font-semibold', colorClassName)}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
