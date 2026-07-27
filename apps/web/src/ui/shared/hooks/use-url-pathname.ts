import { useLocation } from '@tanstack/react-router'

export function useUrlPathname() {
  return useLocation({ select: (location) => location.pathname })
}
