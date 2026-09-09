import type { ClientDetails, ClientConsent } from '@hms/core/identity/domain/entities'
import type { ConsentType } from '@hms/core/identity/domain/structures'
import type { IdentityService } from '@hms/core/identity/interfaces'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type ClientRegistrationConsentType = Exclude<ConsentType, 'data_processing'>

type ClientLookupCriteria = Parameters<IdentityService['lookupClient']>[0]
type ClientRegistrationInput = Parameters<IdentityService['registerClient']>[0]

export type ClientLookupResult =
  | { kind: 'existing'; details: ClientDetails }
  | { kind: 'not-found' }
  | { kind: 'error' }

export type ClientRegistrationResult =
  | { kind: 'registered'; details: ClientDetails }
  | { kind: 'existing'; details: ClientDetails }
  | { kind: 'error' }

export type ClientConsentGrantResult = {
  details: ClientDetails
  pendingConsentTypes: readonly ClientRegistrationConsentType[]
}

export const useClientRegistrationActions = () => {
  const { identityService } = useRestContext()

  async function lookupClient(
    criteria: ClientLookupCriteria,
  ): Promise<ClientLookupResult> {
    const response = await identityService.lookupClient(criteria)

    if (response.isSuccessful) {
      return { kind: 'existing', details: response.body }
    }
    if (response.statusCode === HTTP_STATUS_CODE.notFound) {
      return { kind: 'not-found' }
    }

    return { kind: 'error' }
  }

  async function registerClient(
    input: ClientRegistrationInput,
  ): Promise<ClientRegistrationResult> {
    const response = await identityService.registerClient(input)

    if (response.isSuccessful) {
      return { kind: 'registered', details: response.body }
    }
    if (response.statusCode === HTTP_STATUS_CODE.conflict && input.taxId) {
      const lookup = await lookupClient({ taxId: input.taxId })
      if (lookup.kind === 'existing') return lookup
    }

    return { kind: 'error' }
  }

  async function grantClientConsents(
    clientDetails: ClientDetails,
    consentTypes: readonly ClientRegistrationConsentType[],
  ): Promise<ClientConsentGrantResult> {
    let details = clientDetails
    const pendingConsentTypes: ClientRegistrationConsentType[] = []

    for (const consentType of consentTypes) {
      const response = await identityService.grantClientConsent(
        clientDetails.client.id,
        consentType,
      )

      if (response.isSuccessful) {
        details = {
          ...details,
          consents: [
            ...details.consents.filter((consent) => consent.type !== consentType),
            response.body as ClientConsent,
          ],
        }
        continue
      }

      if (response.statusCode === HTTP_STATUS_CODE.conflict) {
        const refreshed = await identityService.getClient(clientDetails.client.id)
        if (
          refreshed.isSuccessful &&
          refreshed.body.consents.some((consent) => consent.type === consentType)
        ) {
          details = refreshed.body
          continue
        }
      }

      pendingConsentTypes.push(consentType)
    }

    return { details, pendingConsentTypes }
  }

  return { grantClientConsents, lookupClient, registerClient }
}
