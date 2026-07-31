import { useCallback, useMemo, useRef } from 'react'

import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IntakeService } from '@/rest/services/intake-service'
import { IdentityService } from '@/rest/services/identity-service'
import { LegalCatalogService } from '@/rest/services/legal-catalog-service'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { SchedulingService } from '@/rest/services/scheduling-service'

import type { RestContextValue } from './types/rest-context-value'
import { BROWSER_ENV } from '@/constants'

export const useRestContextProvider = (): RestContextValue => {
  const { getSession, signOut } = useAuthContext()
  const { navigateTo } = useNavigation()
  const isHandlingUnauthorized = useRef(false)
  const handleUnauthorized = useCallback(async () => {
    if (isHandlingUnauthorized.current) return

    isHandlingUnauthorized.current = true
    await signOut()
    await navigateTo('login')
  }, [navigateTo, signOut])

  const restClient = useMemo(
    () => AxiosRestClient(BROWSER_ENV.hmsServerAppUrl, getSession, handleUnauthorized),
    [getSession, handleUnauthorized],
  )

  return {
    intakeService: IntakeService(restClient),
    identityService: IdentityService(restClient),
    legalCatalogService: LegalCatalogService(restClient),
    schedulingService: SchedulingService(restClient),
  }
}
