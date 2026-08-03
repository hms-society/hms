import type { ComponentPropsWithoutRef } from 'react'

import { Link, type ToPathOption } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export type AnchorProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  params?: Record<string, string>
  route: RouteName
}

export const Anchor = ({ children, params, route, ...props }: AnchorProps) => {
  return (
    <Link to={ROUTES[route] as ToPathOption} params={params} {...props}>
      {children}
    </Link>
  )
}
