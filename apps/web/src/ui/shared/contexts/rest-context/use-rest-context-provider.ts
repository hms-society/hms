import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IntakeService } from '@/rest/services/intake-service'
import { IdentityService } from '@/rest/services/identity-service'

import type { RestContextValue } from './types/rest-context-value'
import { BROWSER_ENV } from '@/constants'

export const useRestContextProvider = (): RestContextValue => {
  const restClient = AxiosRestClient(BROWSER_ENV.hmsServerAppUrl)

  return {
    intakeService: IntakeService(restClient),
    identityService: IdentityService(restClient),
  }
}
