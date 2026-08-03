import { useLocation } from '@tanstack/react-router'

export function useUrlPathname() {
  return useLocation({
    select: function selectPathname(location) {
      return location.pathname
    },
  })
}
