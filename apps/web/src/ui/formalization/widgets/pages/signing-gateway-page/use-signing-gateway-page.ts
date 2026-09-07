import { useCallback, useEffect, useRef, useState } from 'react'
import type { SignatureGatewayContextDto } from '@hms/validation/formalization'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useExchangeSignatureInvitationAction } from '@/ui/formalization/hooks/use-exchange-signature-invitation-action'
import { useRequestSignatureOtpAction } from '@/ui/formalization/hooks/use-request-signature-otp-action'
import { useVerifySignatureOtpAction } from '@/ui/formalization/hooks/use-verify-signature-otp-action'
import { useEstablishCollaboratorSigningSessionAction } from '@/ui/formalization/hooks/use-establish-collaborator-signing-session-action'
import { useStartSigningAction } from '@/ui/formalization/hooks/use-start-signing-action'
import { useAcknowledgeSignatureDocumentAction } from '@/ui/formalization/hooks/use-acknowledge-signature-document-action'
import { useSignatureResultQuery } from '@/ui/formalization/hooks/use-signature-result-query'
import { useCloseSignatureResultAction } from '@/ui/formalization/hooks/use-close-signature-result-action'
import { useSigningGatewayContextQuery } from '@/ui/formalization/hooks/use-signing-gateway-context-query'
import type { InvitationAccessStepProps } from './invitation-access-step'
import type { ChannelSelectionStepProps } from './channel-selection-step'
import type { OtpVerificationStepProps } from './otp-verification-step'
import type { CollaboratorLoginStepProps } from './collaborator-login-step'
import type { DocumentReadingStepProps } from './document-reading-step'
import type { ProviderSigningStepProps } from './provider-signing-step'
import type { SignatureSubmittedStepProps } from './signature-submitted-step'
import type { SignatureConfirmedStepProps } from './signature-confirmed-step'
import type { SigningUnavailableStepProps } from './signing-unavailable-step'

export type SigningGatewayPageState =
  | { step: 'exchanging' }
  | { step: 'invitation'; props: InvitationAccessStepProps }
  | { step: 'choose_channel'; props: ChannelSelectionStepProps }
  | { step: 'enter_otp'; props: OtpVerificationStepProps }
  | { step: 'collaborator_login'; props: CollaboratorLoginStepProps }
  | { step: 'reading'; props: DocumentReadingStepProps }
  | { step: 'provider'; props: ProviderSigningStepProps }
  | { step: 'submitted'; props: SignatureSubmittedStepProps }
  | { step: 'confirmed'; props: SignatureConfirmedStepProps }
  | { step: 'unavailable'; props: SigningUnavailableStepProps }

export function useSigningGatewayPage(): SigningGatewayPageState {
  const { session } = useAuthContext()
  const contextQuery = useSigningGatewayContextQuery(false)
  const exchange = useExchangeSignatureInvitationAction()
  const requestOtp = useRequestSignatureOtpAction()
  const verifyOtp = useVerifySignatureOtpAction()
  const collaboratorSession = useEstablishCollaboratorSigningSessionAction()
  const startSigning = useStartSigningAction()
  const acknowledgeDocument = useAcknowledgeSignatureDocumentAction()
  const result = useSignatureResultQuery(false)
  const closeResult = useCloseSignatureResultAction()
  const [state, setState] = useState<SigningGatewayPageState>({ step: 'exchanging' })
  const stateRef = useRef(state)
  const initialized = useRef<Promise<SignatureGatewayContextDto | undefined> | null>(null)
  const initializedContextApplied = useRef(false)
  const readingContext = useRef<Extract<
    SignatureGatewayContextDto,
    { step: 'reading' }
  > | null>(null)
  const collaboratorEstablishment = useRef<
    Promise<SignatureGatewayContextDto> | undefined
  >(undefined)
  const collaboratorContextApplied = useRef(false)
  stateRef.current = state

  const applyContext = useCallback((context: SignatureGatewayContextDto) => {
    if (context.step === 'reading') readingContext.current = context
    setState(contextToState(context))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function initialize() {
      function readInvitationToken() {
        const fragment = window.location.hash.slice(1)
        if (!fragment) return undefined
        try {
          const decoded = decodeURIComponent(fragment)
          if (!decoded.startsWith('{')) return decoded
          const payload: unknown = JSON.parse(decoded)
          return typeof payload === 'object' &&
            payload !== null &&
            'token' in payload &&
            typeof payload.token === 'string'
            ? payload.token
            : undefined
        } catch {
          return undefined
        }
      }

      const token = readInvitationToken()
      const response = token ? await exchange.execute(token) : undefined
      const context = response
        ? response.isFailure
          ? undefined
          : response.body
        : await contextQuery.refetch()
      if (window.location.hash)
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`,
        )
      if (!context)
        throw new Error(
          response?.errorMessage ??
            contextQuery.error ??
            'Signing Gateway context unavailable.',
        )
      return context
    }
    const request = initialized.current ?? (initialized.current = initialize())
    void request
      .then((context) => {
        if (!cancelled && context && !initializedContextApplied.current) {
          initializedContextApplied.current = true
          applyContext(context)
        }
      })
      .catch((cause) => {
        if (!cancelled && !initializedContextApplied.current) {
          initializedContextApplied.current = true
          setState({
            step: 'unavailable',
            props: {
              reason: 'access_unavailable',
              error: cause instanceof Error ? cause.message : undefined,
            },
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [applyContext, contextQuery.error, contextQuery.refetch, exchange.execute])

  useEffect(() => {
    if (
      state.step !== 'collaborator_login' ||
      !session?.accessToken ||
      collaboratorContextApplied.current
    )
      return

    let cancelled = false

    async function establishCollaboratorSession() {
      const response = await collaboratorSession.execute()
      if (response.isFailure) throw new Error(response.errorMessage)
      return response.body
    }

    const request =
      collaboratorEstablishment.current ??
      (collaboratorEstablishment.current = establishCollaboratorSession())

    void request
      .then((context) => {
        if (!cancelled && !collaboratorContextApplied.current) {
          collaboratorContextApplied.current = true
          if (stateRef.current.step === 'collaborator_login') applyContext(context)
        }
      })
      .catch((cause) => {
        if (!cancelled && !collaboratorContextApplied.current) {
          collaboratorContextApplied.current = true
          const current = stateRef.current
          if (
            current.step === 'collaborator_login' &&
            cause instanceof Error &&
            cause.message ===
              'Entre com a conta do colaborador atribuído a esta assinatura.'
          )
            setState({
              step: 'collaborator_login',
              props: { ...current.props, error: 'account_mismatch' },
            })
          else
            setState({
              step: 'unavailable',
              props: {
                reason: 'access_unavailable',
                error: cause instanceof Error ? cause.message : undefined,
              },
            })
        }
      })

    return () => {
      cancelled = true
    }
  }, [applyContext, collaboratorSession.execute, session?.accessToken, state.step])

  async function handleInvitationContinue() {
    try {
      const context = await contextQuery.refetch()
      if (!context) {
        throw new Error(contextQuery.error ?? 'Signing Gateway context unavailable.')
      }
      applyContext(context)
    } catch (cause) {
      setState({
        step: 'unavailable',
        props: {
          reason: 'access_unavailable',
          error: cause instanceof Error ? cause.message : undefined,
        },
      })
    }
  }

  async function handleChannelContinue(channelId: string) {
    if (!channelId) return
    const response = await requestOtp.execute(channelId)
    if (response.isFailure) {
      setState({
        step: 'unavailable',
        props: { reason: 'access_unavailable', error: response.errorMessage },
      })
      return
    }
    setState({
      step: 'enter_otp',
      props: otpProps(
        response.body.challengeId,
        channelId,
        response.body.expiresAt,
        response.body.resendAvailableAt,
      ),
    })
  }

  function otpProps(
    challengeId: string,
    channelId: string,
    expiresAt: string,
    resendAvailableAt: string,
  ): OtpVerificationStepProps {
    return {
      code: '',
      expiresAt,
      resendAvailableAt,
      isPending: verifyOtp.isPending || requestOtp.isPending,
      onCodeChange: (code) =>
        setState((current) =>
          current.step === 'enter_otp'
            ? { ...current, props: { ...current.props, code } }
            : current,
        ),
      onVerify: () => {
        const current = stateRef.current
        if (current.step !== 'enter_otp') return
        void verifyOtp
          .execute({ challengeId, code: current.props.code })
          .then((response) => {
            if (response.isFailure) {
              setState({
                step: 'enter_otp',
                props: { ...current.props, error: 'invalid' },
              })
              return
            }
            applyContext(response.body)
          })
      },
      onResend: () => void handleChannelContinue(channelId),
    }
  }

  function handleCollaboratorContinue() {
    return undefined
  }

  function handleReadingContinue() {
    const current = stateRef.current
    const context = readingContext.current
    if (current.step !== 'reading' || !context) return
    const allAcknowledged = context.documents.every((document) =>
      current.props.acknowledgedDocumentIds.includes(document.id),
    )
    if (!allAcknowledged) return
    void startSigning.execute(context.requestVersion).then((response) => {
      if (response.isFailure) {
        setState({
          step: 'unavailable',
          props: { reason: 'access_unavailable', error: response.errorMessage },
        })
        return
      }
      setState({
        step: 'provider',
        props: {
          proxyPath: response.body.proxyPath,
          title: 'Documento para assinatura',
          onSubmitted: handleSubmitted,
          onUnavailable: handleUnavailable,
        },
      })
    })
  }

  function handleSelectDocument(requestDocumentId: string) {
    setState((current) =>
      current.step === 'reading'
        ? { ...current, props: { ...current.props, activeDocumentId: requestDocumentId } }
        : current,
    )
  }

  function handleAcknowledgeDocument(requestDocumentId: string) {
    const context = readingContext.current
    if (!context) return
    void acknowledgeDocument
      .execute({ requestDocumentId, expectedRequestVersion: context.requestVersion })
      .then((response) => {
        if (response.isFailure) {
          setState((current) =>
            current.step === 'reading'
              ? {
                  ...current,
                  props: { ...current.props, actionError: response.errorMessage },
                }
              : current,
          )
          return
        }
        setState((current) => {
          if (current.step !== 'reading') return current
          const acknowledgedDocumentIds = Array.from(
            new Set([
              ...current.props.acknowledgedDocumentIds,
              response.body.requestDocumentId,
            ]),
          )
          if (readingContext.current)
            readingContext.current = {
              ...readingContext.current,
              acknowledgedDocumentIds,
            }
          return {
            ...current,
            props: {
              ...current.props,
              acknowledgedDocumentIds,
              actionError: undefined,
            },
          }
        })
      })
  }

  function handleSubmitted() {
    void result.refetch().then((value) => {
      if (!value) return
      if (value.status === 'confirmed' && value.protocol)
        setState({
          step: 'confirmed',
          props: {
            result: value as SignatureConfirmedStepProps['result'],
            onClose: handleClose,
          },
        })
      else
        setState({
          step: 'submitted',
          props: { result: value, onRefresh: handleSubmitted, onClose: handleClose },
        })
    })
  }

  function handleUnavailable() {
    setState({
      step: 'unavailable',
      props: { reason: 'provider_unavailable', onRetry: handleSubmitted },
    })
  }

  function handleClose() {
    void closeResult
      .execute()
      .then(() => setState({ step: 'unavailable', props: { reason: 'expired' } }))
  }

  if (state.step === 'invitation')
    return {
      step: 'invitation',
      props: { ...state.props, onContinue: handleInvitationContinue },
    }
  if (state.step === 'choose_channel')
    return {
      step: 'choose_channel',
      props: {
        ...state.props,
        onContinue: () =>
          void handleChannelContinue(
            state.props.selectedChannelId ?? state.props.channels[0]?.id ?? '',
          ),
      },
    }
  if (state.step === 'collaborator_login')
    return {
      step: 'collaborator_login',
      props: { ...state.props, onContinue: handleCollaboratorContinue },
    }
  if (state.step === 'enter_otp')
    return {
      step: 'enter_otp',
      props: {
        ...state.props,
        isPending: verifyOtp.isPending || requestOtp.isPending,
      },
    }
  if (state.step === 'reading')
    return {
      step: 'reading',
      props: {
        ...state.props,
        isPending: acknowledgeDocument.isPending || startSigning.isPending,
        onSelectDocument: handleSelectDocument,
        onAcknowledgeDocument: handleAcknowledgeDocument,
        onContinue: handleReadingContinue,
      },
    }
  return state
}

function contextToState(context: SignatureGatewayContextDto): SigningGatewayPageState {
  switch (context.step) {
    case 'invitation':
      return {
        step: 'invitation',
        props: { isPending: false, onContinue: () => undefined },
      }
    case 'choose_channel':
      return {
        step: 'choose_channel',
        props: {
          channels: context.channels,
          isPending: false,
          onSelect: () => undefined,
          onContinue: () => undefined,
        },
      }
    case 'enter_otp':
      return {
        step: 'enter_otp',
        props: {
          code: '',
          expiresAt: context.expiresAt,
          resendAvailableAt: context.resendAvailableAt,
          isPending: false,
          onCodeChange: () => undefined,
          onVerify: () => undefined,
          onResend: () => undefined,
        },
      }
    case 'collaborator_login':
      return {
        step: 'collaborator_login',
        props: {
          loginPath: context.loginPath,
          isPending: false,
          onContinue: () => undefined,
        },
      }
    case 'reading':
      return {
        step: 'reading',
        props: {
          documents: context.documents,
          acknowledgedDocumentIds: context.acknowledgedDocumentIds,
          activeDocumentId: context.documents[0]?.id ?? '',
          isPending: false,
          onSelectDocument: () => undefined,
          onAcknowledgeDocument: () => undefined,
          onContinue: () => undefined,
        },
      }
    case 'submitted':
      return {
        step: 'submitted',
        props: {
          result: context.result,
          onRefresh: () => undefined,
          onClose: () => undefined,
        },
      }
    case 'confirmed':
      return {
        step: 'confirmed',
        props: { result: context.result, onClose: () => undefined },
      }
    case 'unavailable':
      return {
        step: 'unavailable',
        props: {
          reason: context.reason,
          result: context.result,
          retryAt: context.retryAt,
        },
      }
  }
}
