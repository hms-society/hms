import { useNavigate } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export type Navigation = {
  navigateTo: (
    route: RouteName,
    options?: { params?: Record<string, string> },
  ) => Promise<void>
}

export function useNavigation(): Navigation {
  const navigate = useNavigate()

  function navigateTo(
    route: RouteName,
    options?: { params?: Record<string, string> },
  ): Promise<void> {
    return navigate({ to: ROUTES[route] as any, params: options?.params as any })
  }

  return { navigateTo }
}
