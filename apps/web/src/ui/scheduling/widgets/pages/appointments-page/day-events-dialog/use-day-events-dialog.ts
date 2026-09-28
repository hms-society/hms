import { useEffect, useRef } from 'react'

export function useDayEventsDialog(open: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) triggerRef.current?.focus()
  }, [open])

  return {
    captureTrigger(element: HTMLElement | null) {
      triggerRef.current = element
    },
  }
}
