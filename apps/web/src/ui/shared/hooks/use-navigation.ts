import { useNavigate } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export type Navigation = {
  navigateTo: (
    route: RouteName,
    options?: { params?: Record<string, string> },
  ) => Promise<void>
  navigateCollaboratorsSearch: (
    search:
      | Record<string, unknown>
      | ((previous: Record<string, unknown>) => Record<string, unknown>),
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

  function navigateCollaboratorsSearch(
    search:
      | Record<string, unknown>
      | ((previous: Record<string, unknown>) => Record<string, unknown>),
  ): Promise<void> {
    return navigate({ to: ROUTES.collaborators, search: search as any })
  }

  return { navigateTo, navigateCollaboratorsSearch }
}
