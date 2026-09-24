import { SetMetadata } from '@nestjs/common'

export const ROUTE_ACCESS = Symbol('IDENTITY_ROUTE_ACCESS')

export const RouteAccess = (
  access: 'public' | 'case-portal' | 'case-portal-upload' | 'internal',
) => SetMetadata(ROUTE_ACCESS, access)
