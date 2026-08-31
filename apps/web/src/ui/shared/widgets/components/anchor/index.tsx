import type { ComponentPropsWithoutRef } from 'react'

import { Link, type ToPathOption } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export type AnchorProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  route: RouteName
  params?: Record<string, string>
  search?: Record<string, unknown>
}

export const Anchor = ({ children, route, params, search, ...props }: AnchorProps) => {
  return (
    <Link
      to={ROUTES[route] as ToPathOption}
      params={params}
      search={search as never}
      {...props}
    >
      {children}
    </Link>
  )
}
