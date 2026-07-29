import type { ComponentPropsWithoutRef } from 'react'

import { Link, type ToPathOption } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export type AnchorProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  route: RouteName
}

export const Anchor = ({ children, route, ...props }: AnchorProps) => {
  return (
    <Link to={ROUTES[route] as ToPathOption} {...props}>
      {children}
    </Link>
  )
}
