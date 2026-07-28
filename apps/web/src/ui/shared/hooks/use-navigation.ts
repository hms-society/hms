import { useNavigate } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export type Navigation = {
  navigateTo: (route: RouteName) => Promise<void>
}

export function useNavigation(): Navigation {
  const navigate = useNavigate()

  function navigateTo(route: RouteName): Promise<void> {
    return navigate({ to: ROUTES[route] as any })
  }

  return { navigateTo }
}
