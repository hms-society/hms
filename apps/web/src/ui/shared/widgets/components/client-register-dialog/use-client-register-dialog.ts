import { useCallback, useEffect, useRef, useState, type BaseSyntheticEvent } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'

import type { ConsentType } from '@hms/core/identity/domain/structures'
import { lookupClientSchema, registerClientSchema } from '@hms/validation/identity'
import type { ClientDetails } from '@hms/core/identity/domain/entities'

import { useClientRegistrationActions } from '@/ui/identity/hooks/use-client-registration-actions'

export type ClientRegisterDialogState =
  | 'identification'
  | 'existing-client'
  | 'not-found'
  | 'registration'
  | 'privacy'
  | 'review'

export type ClientRegisterDialogSearchResult =
  | { kind: 'existing'; details: ClientDetails }
  | { kind: 'not-found'; criteria: z.output<typeof lookupClientSchema> }

export type ClientRegisterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientSelected: (clientDetails: ClientDetails) => void
}

export type LookupClientForm = z.input<typeof lookupClientSchema>
export type RegistrationForm = z.input<typeof registerClientSchema>
export type RegistrationValues = z.output<typeof registerClientSchema>

export const CONSENT_TYPES = [
  'whatsapp_communication',
  'email_communication',
  'third_party_sharing',
] as const satisfies readonly ConsentType[]

export type RegistrationConsentType = (typeof CONSENT_TYPES)[number]

const EMPTY_REGISTRATION: RegistrationForm = {
  type: 'natural',
  name: '',
  legalName: '',
  tradeName: '',
  taxId: '',
  phone: '',
  email: '',
  address: {
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    zipCode: '',
  },
  consents: {
    whatsapp_communication: false,
    email_communication: false,
    third_party_sharing: false,
  },
}

const CONSENT_LABELS: Record<RegistrationConsentType, string> = {
  whatsapp_communication: 'comunicação por WhatsApp',
  email_communication: 'comunicação por e-mail',
  third_party_sharing: 'compartilhamento com terceiros',
}

function formatTaxId(value: string) {
  return value.length === 14
    ? value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    : value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatPhone(value?: string) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 11) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return value
}

export function useClientRegisterDialog({
  open,
  onOpenChange,
  onClientSelected,
}: ClientRegisterDialogProps) {
  const { grantClientConsents, lookupClient, registerClient } =
    useClientRegistrationActions()
  const [state, setState] = useState<ClientRegisterDialogState>('identification')
  const [searchResult, setSearchResult] = useState<ClientRegisterDialogSearchResult>()
  const [asyncError, setAsyncError] = useState<string>()
  const [requestLock, setRequestLock] = useState<'lookup' | 'registration' | 'consents'>()
  const [createdClientDetails, setCreatedClientDetails] = useState<ClientDetails>()
  const wasOpen = useRef(false)

  const identificationForm = useForm<LookupClientForm>({
    resolver: zodResolver(lookupClientSchema),
    defaultValues: { taxId: '', phone: '' },
  })
  const registrationForm = useForm<RegistrationForm, unknown, RegistrationValues>({
    resolver: zodResolver(registerClientSchema),
    defaultValues: EMPTY_REGISTRATION,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  })

  const resetFlow = useCallback(
    function resetFlow() {
      setState('identification')
      setSearchResult(undefined)
      setAsyncError(undefined)
      setRequestLock(undefined)
      setCreatedClientDetails(undefined)
      identificationForm.reset({ taxId: '', phone: '' })
      registrationForm.reset(EMPTY_REGISTRATION)
    },
    [identificationForm, registrationForm],
  )

  useEffect(
    function resetDialogOnOpen() {
      if (open && !wasOpen.current) resetFlow()
      wasOpen.current = open
    },
    [open, resetFlow],
  )

  async function handleLookup(event?: BaseSyntheticEvent) {
    event?.stopPropagation()

    await identificationForm.handleSubmit(async function handleLookupSubmit(criteria) {
      if (requestLock) return

      setRequestLock('lookup')
      setAsyncError(undefined)

      try {
        const result = await lookupClient(criteria)

        if (result.kind === 'existing') {
          setSearchResult({ kind: 'existing', details: result.details })
          setState('existing-client')
        } else if (result.kind === 'not-found') {
          setSearchResult({
            kind: 'not-found',
            criteria: criteria as z.output<typeof lookupClientSchema>,
          })
          setState('not-found')
        } else {
          setAsyncError(
            'Não foi possível realizar a busca. Verifique os dados e tente novamente.',
          )
        }
      } finally {
        setRequestLock(undefined)
      }
    })(event)
  }

  function handleClearIdentification() {
    identificationForm.reset({ taxId: '', phone: '' })
    setAsyncError(undefined)
  }

  function handleSearchAnotherClient() {
    handleClearIdentification()
    setSearchResult(undefined)
    setState('identification')
  }

  function handleSelectExistingClient() {
    if (searchResult?.kind !== 'existing') return

    onOpenChange(false)
    onClientSelected(searchResult.details)
  }

  function handleContinueToRegistration() {
    if (searchResult?.kind !== 'not-found') return
    const taxId = searchResult.criteria.taxId ?? ''
    registrationForm.reset({
      ...EMPTY_REGISTRATION,
      type: taxId.length === 14 ? 'legal' : 'natural',
      taxId: formatTaxId(taxId),
      phone: formatPhone(searchResult.criteria.phone),
    })
    setAsyncError(undefined)
    setState('registration')
  }

  function handleBackToIdentification() {
    setState('identification')
  }

  function handleEditRegistration() {
    registrationForm.reset(registrationForm.getValues())
    setAsyncError(undefined)
    setState('registration')
  }

  function handleBackToRegistration() {
    setState('registration')
  }

  function handleBackToPrivacy() {
    setState('privacy')
  }

  function handleClientTypeChange(type: RegistrationForm['type']) {
    const current = registrationForm.getValues()
    const hasTypeData = Boolean(current.name || current.legalName || current.tradeName)

    if (
      current.type !== type &&
      hasTypeData &&
      !window.confirm('Os dados específicos do tipo atual serão removidos. Continuar?')
    ) {
      return false
    }

    registrationForm.setValue('type', type)
    if (type === 'natural') {
      registrationForm.setValue('legalName', '')
      registrationForm.setValue('tradeName', '')
    } else {
      registrationForm.setValue('name', '')
    }
    return true
  }

  async function handleContinueToPrivacy() {
    const valid = await registrationForm.trigger([
      'type',
      'name',
      'legalName',
      'tradeName',
      'taxId',
      'phone',
      'email',
      'address',
    ])
    if (valid) {
      setAsyncError(undefined)
      setState('privacy')
    }
    return valid
  }

  async function handleContinueToReview() {
    const valid = await registrationForm.trigger('consents')
    if (valid) {
      setAsyncError(undefined)
      setState('review')
    }
    return valid
  }

  function getSelectedConsentTypes(values: {
    consents?: Partial<Record<RegistrationConsentType, boolean>>
  }) {
    return CONSENT_TYPES.filter(function isSelectedConsent(type) {
      return values.consents?.[type] === true
    })
  }

  const completeCreatedClient = useCallback(
    async function completeCreatedClient(
      clientDetails: ClientDetails,
      types: readonly RegistrationConsentType[],
    ) {
      if (types.length === 0) {
        onClientSelected(clientDetails)
        onOpenChange(false)
        return
      }

      setRequestLock('consents')
      setAsyncError(undefined)
      const { details: currentDetails, pendingConsentTypes } = await grantClientConsents(
        clientDetails,
        types,
      )

      setCreatedClientDetails(currentDetails)
      setRequestLock(undefined)

      if (pendingConsentTypes.length > 0) {
        setAsyncError(
          `O cliente foi criado, mas há consentimentos pendentes: ${pendingConsentTypes
            .map(function getConsentLabel(type) {
              return CONSENT_LABELS[type]
            })
            .join(', ')}.`,
        )
        return
      }

      onClientSelected(currentDetails)
      onOpenChange(false)
    },
    [grantClientConsents, onClientSelected, onOpenChange],
  )

  async function handleSubmitRegistration(event?: BaseSyntheticEvent) {
    event?.stopPropagation()

    await registrationForm.handleSubmit(async function handleRegistrationSubmit(values) {
      if (requestLock) return

      if (createdClientDetails) {
        await completeCreatedClient(createdClientDetails, getSelectedConsentTypes(values))
        return
      }

      setRequestLock('registration')
      setAsyncError(undefined)
      const request = {
        type: values.type,
        name: values.name,
        legalName: values.legalName,
        tradeName: values.tradeName,
        taxId: values.taxId,
        phone: values.phone,
        email: values.email,
        address: values.address,
      }
      const result = await registerClient(request)
      setRequestLock(undefined)

      if (result.kind === 'registered') {
        setCreatedClientDetails(result.details)
        await completeCreatedClient(result.details, getSelectedConsentTypes(values))
        return
      }

      if (result.kind === 'existing') {
        setSearchResult({ kind: 'existing', details: result.details })
        setState('existing-client')
        return
      }

      setAsyncError(
        'Não foi possível criar o cliente. Verifique os dados e tente novamente.',
      )
    })(event)
  }

  async function handleRetryPendingConsents() {
    if (!createdClientDetails) return
    const pending = getSelectedConsentTypes(registrationForm.getValues()).filter(
      function isPendingConsent(type) {
        return !createdClientDetails.consents.some(function hasConsent(consent) {
          return consent.type === type
        })
      },
    )
    await completeCreatedClient(createdClientDetails, pending)
  }

  const dialogContentRef = useRef<HTMLDivElement>(null)

  useEffect(
    function focusDialogStep() {
      if (!open) return

      const frame = requestAnimationFrame(function focusDialogContent() {
        if (state === 'identification') {
          dialogContentRef.current
            ?.querySelector<HTMLInputElement>('#client-lookup-tax-id')
            ?.focus()
          return
        }

        const heading = dialogContentRef.current?.querySelector<HTMLElement>('h2')
        if (!heading) return
        heading.tabIndex = -1
        heading.focus()
      })

      return function cancelDialogFocus() {
        cancelAnimationFrame(frame)
      }
    },
    [open, state],
  )

  return {
    state,
    searchResult,
    asyncError,
    requestLock,
    createdClientDetails,
    dialogContentRef,
    identificationForm,
    registrationForm,
    isBusy: Boolean(requestLock),
    handleLookup,
    handleClearIdentification,
    handleSearchAnotherClient,
    handleSelectExistingClient,
    handleContinueToRegistration,
    handleBackToIdentification,
    handleEditRegistration,
    handleBackToRegistration,
    handleBackToPrivacy,
    handleClientTypeChange,
    handleContinueToPrivacy,
    handleContinueToReview,
    handleSubmitRegistration,
    handleRetryPendingConsents,
  }
}

export type ClientRegisterDialogValues = ReturnType<typeof useClientRegisterDialog>
export type ClientRegisterDialogForm = UseFormReturn<RegistrationForm>
