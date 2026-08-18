import { useCallback, useMemo, useRef } from 'react'

import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IntakeService } from '@/rest/services/intake-service'
import { IdentityService } from '@/rest/services/identity-service'
import { LegalCatalogService } from '@/rest/services/legal-catalog-service'
import { CommunicationService } from '@/rest/services/communication-service'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { ConsultationService } from '@/rest/services/consultation-service'
import { DocumentProductionService } from '@/rest/services/document-production-service'
import { documentService } from '@/rest/services/DocumentEngineService'
import { AiSuggestionsService } from '@/rest/services/AiSuggestionsService'
import { DocumentValidationService } from '@/rest/services/document-validation-service'

import type { RestContextValue } from './types/rest-context-value'
import { BROWSER_ENV } from '@/constants'

export function useRestContextProvider(): RestContextValue {
  const { getSession, signOut } = useAuthContext()
  const { navigateTo } = useNavigation()
  const isHandlingUnauthorized = useRef(false)
  const handleUnauthorized = useCallback(
    async function handleUnauthorized() {
      if (isHandlingUnauthorized.current) return

      isHandlingUnauthorized.current = true
      await signOut()
      await navigateTo('login')
    },
    [navigateTo, signOut],
  )

  const restClient = useMemo(
    function createRestClient() {
      return AxiosRestClient(BROWSER_ENV.hmsServerAppUrl, getSession, handleUnauthorized)
    },
    [getSession, handleUnauthorized],
  )

  return {
    intakeService: IntakeService(restClient),
    identityService: IdentityService(restClient),
    legalCatalogService: LegalCatalogService(restClient),
    communicationService: CommunicationService(restClient),
    consultationService: ConsultationService(restClient),
    documentProductionService: DocumentProductionService(restClient),
    documentService: documentService(restClient),
    aiSuggestionsService: AiSuggestionsService(restClient),
    documentValidationService: DocumentValidationService(restClient),
  }
}
