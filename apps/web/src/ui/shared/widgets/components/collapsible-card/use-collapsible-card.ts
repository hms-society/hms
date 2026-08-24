import { useId, useState, type ReactNode } from 'react'

export type CollapsibleCardProps = {
  title: ReactNode
  children: ReactNode
  headerActions?: ReactNode
  isOptional?: boolean
  className?: string
  contentClassName?: string
  defaultOpen?: boolean
}

export function useCollapsibleCard(defaultOpen: boolean) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()

  function handleToggle() {
    setIsOpen((current) => !current)
  }

  return { contentId, handleToggle, isOpen }
}
