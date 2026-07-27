import type { IconProps } from '../types'
import { ICONS } from './icons'

export const Icon = ({ name, className }: IconProps) => {
  const Icon = ICONS[name]

  return <Icon aria-hidden='true' className={className} />
}
