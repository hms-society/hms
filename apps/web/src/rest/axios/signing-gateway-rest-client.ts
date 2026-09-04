import type { AuthSession } from '@hms/core/identity/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'

import { AxiosRestClient } from './axios-rest-client'

/** Gateway requests are cookie-bound and must never trigger the global sign-out interceptor. */
export const SigningGatewayRestClient = (
  baseUrl: string | undefined,
  getSession: () => Promise<AuthSession | null>,
): RestClient =>
  AxiosRestClient(baseUrl, getSession, async () => undefined, {
    credentials: 'include',
  })
