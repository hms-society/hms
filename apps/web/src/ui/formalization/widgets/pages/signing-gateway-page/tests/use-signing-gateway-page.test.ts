import { act, renderHook, waitFor } from '@testing-library/react'
import type { SignatureGatewayContextDto } from '@hms/validation/formalization'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSigningGatewayPage } from '../use-signing-gateway-page'

const mocks = vi.hoisted(() => ({
  authSession: undefined as { accessToken: string } | undefined,
  acknowledgeExecute: vi.fn(),
  closeResultExecute: vi.fn(),
  collaboratorExecute: vi.fn(),
  contextRefetch: vi.fn(),
  exchangeExecute: vi.fn(),
  requestOtpExecute: vi.fn(),
  requestOtpPending: false,
  resultRefetch: vi.fn(),
  startSigningExecute: vi.fn(),
  verifyOtpExecute: vi.fn(),
  verifyOtpPending: false,
}))

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: () => ({ session: mocks.authSession }),
}))
vi.mock('@/ui/formalization/hooks/use-signing-gateway-context-query', () => ({
  useSigningGatewayContextQuery: () => ({
    error: undefined,
    refetch: mocks.contextRefetch,
  }),
}))
vi.mock('@/ui/formalization/hooks/use-exchange-signature-invitation-action', () => ({
  useExchangeSignatureInvitationAction: () => ({
    execute: mocks.exchangeExecute,
    isPending: false,
  }),
}))
vi.mock('@/ui/formalization/hooks/use-request-signature-otp-action', () => ({
  useRequestSignatureOtpAction: () => ({
    execute: mocks.requestOtpExecute,
    isPending: mocks.requestOtpPending,
  }),
}))
vi.mock('@/ui/formalization/hooks/use-verify-signature-otp-action', () => ({
  useVerifySignatureOtpAction: () => ({
    execute: mocks.verifyOtpExecute,
    isPending: mocks.verifyOtpPending,
  }),
}))
vi.mock(
  '@/ui/formalization/hooks/use-establish-collaborator-signing-session-action',
  () => ({
    useEstablishCollaboratorSigningSessionAction: () => ({
      execute: mocks.collaboratorExecute,
      isPending: false,
    }),
  }),
)
vi.mock('@/ui/formalization/hooks/use-acknowledge-signature-document-action', () => ({
  useAcknowledgeSignatureDocumentAction: () => ({
    execute: mocks.acknowledgeExecute,
    isPending: false,
  }),
}))
vi.mock('@/ui/formalization/hooks/use-start-signing-action', () => ({
  useStartSigningAction: () => ({ execute: mocks.startSigningExecute, isPending: false }),
}))
vi.mock('@/ui/formalization/hooks/use-signature-result-query', () => ({
  useSignatureResultQuery: () => ({ refetch: mocks.resultRefetch }),
}))
vi.mock('@/ui/formalization/hooks/use-close-signature-result-action', () => ({
  useCloseSignatureResultAction: () => ({ execute: mocks.closeResultExecute }),
}))

const invitationContext: SignatureGatewayContextDto = {
  step: 'invitation',
  csrfToken: 'csrf',
}
const documents = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Contrato',
    position: 0,
    pageCount: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Procuração',
    position: 1,
    pageCount: 1,
  },
] as const
const readingContext: SignatureGatewayContextDto = {
  step: 'reading',
  documents,
  acknowledgedDocumentIds: [],
  requestVersion: 4,
  csrfToken: 'csrf',
}

describe('useSigningGatewayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authSession = undefined
    mocks.requestOtpPending = false
    mocks.verifyOtpPending = false
    window.history.replaceState(null, '', '/assinaturas/acesso')
    mocks.contextRefetch.mockResolvedValue(invitationContext)
    mocks.acknowledgeExecute.mockImplementation(({ requestDocumentId }) =>
      Promise.resolve(
        new RestResponse({
          body: {
            requestDocumentId,
            acknowledgedAt: '2026-09-03T12:00:00Z',
          },
        }),
      ),
    )
    mocks.startSigningExecute.mockResolvedValue(
      new RestResponse({
        body: {
          proxyPath: '/assinaturas/provedor/alias',
          expiresAt: '2026-09-03T12:30:00Z',
        },
      }),
    )
  })

  it('loads an existing invitation session', async () => {
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('invitation'))
    expect(mocks.contextRefetch).toHaveBeenCalledOnce()
  })

  it('keeps the OTP input editable after the code request completes', async () => {
    mocks.contextRefetch.mockResolvedValue({
      step: 'choose_channel',
      channels: [
        {
          id: '00000000-0000-4000-8000-000000000003',
          kind: 'email',
          maskedDestination: 't***@example.com',
        },
      ],
      csrfToken: 'csrf',
    } satisfies SignatureGatewayContextDto)
    mocks.requestOtpExecute.mockResolvedValue(
      new RestResponse({
        body: {
          challengeId: '00000000-0000-4000-8000-000000000004',
          expiresAt: '2026-09-04T22:00:00Z',
          resendAvailableAt: '2026-09-04T21:31:00Z',
        },
      }),
    )

    const { result, rerender } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('choose_channel'))

    mocks.requestOtpPending = true
    rerender()
    act(() => {
      if (result.current.step === 'choose_channel') result.current.props.onContinue()
    })
    await waitFor(() => expect(result.current.step).toBe('enter_otp'))

    mocks.requestOtpPending = false
    rerender()

    if (result.current.step !== 'enter_otp') throw new Error('Expected OTP step')
    expect(result.current.props.isPending).toBe(false)
  })

  it('exchanges and removes the fragment without putting it in history', async () => {
    window.history.replaceState(null, '', '/assinaturas/acesso#invitation-token')
    mocks.exchangeExecute.mockResolvedValue(
      new RestResponse<SignatureGatewayContextDto>({ body: invitationContext }),
    )
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('invitation'))
    expect(mocks.exchangeExecute).toHaveBeenCalledWith('invitation-token')
    expect(window.location.hash).toBe('')
  })

  it('extracts a token from legacy URL-encoded JSON invitation fragments', async () => {
    const fragment = encodeURIComponent(JSON.stringify({ token: 'invitation-token' }))
    window.history.replaceState(null, '', `/assinaturas/acesso#${fragment}`)
    mocks.exchangeExecute.mockResolvedValue(
      new RestResponse<SignatureGatewayContextDto>({ body: invitationContext }),
    )

    const { result } = renderHook(() => useSigningGatewayPage())

    await waitFor(() => expect(result.current.step).toBe('invitation'))
    expect(mocks.exchangeExecute).toHaveBeenCalledWith('invitation-token')
    expect(window.location.hash).toBe('')
  })

  it('exposes every package document in authoritative order', async () => {
    mocks.contextRefetch.mockResolvedValue(readingContext)
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))
    if (result.current.step !== 'reading') throw new Error('Expected reading')
    expect(result.current.props.documents).toEqual(documents)
    expect(result.current.props.activeDocumentId).toBe(documents[0].id)
  })

  it('switches tabs without entering the provider', async () => {
    mocks.contextRefetch.mockResolvedValue(readingContext)
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))
    if (result.current.step !== 'reading') throw new Error('Expected reading')
    act(
      () =>
        result.current.step === 'reading' &&
        result.current.props.onSelectDocument(documents[1].id),
    )
    expect(result.current.step).toBe('reading')
    if (result.current.step === 'reading')
      expect(result.current.props.activeDocumentId).toBe(documents[1].id)
    expect(mocks.startSigningExecute).not.toHaveBeenCalled()
  })

  it('persists acknowledgements independently', async () => {
    mocks.contextRefetch.mockResolvedValue(readingContext)
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))
    act(() => {
      if (result.current.step === 'reading')
        result.current.props.onAcknowledgeDocument(documents[0].id)
    })
    await waitFor(() => {
      if (result.current.step !== 'reading') throw new Error('Expected reading')
      expect(result.current.props.acknowledgedDocumentIds).toEqual([documents[0].id])
    })
    expect(mocks.acknowledgeExecute).toHaveBeenCalledWith({
      requestDocumentId: documents[0].id,
      expectedRequestVersion: 4,
    })
  })

  it('keeps the reading surface available when acknowledgement fails', async () => {
    mocks.contextRefetch.mockResolvedValue(readingContext)
    mocks.acknowledgeExecute.mockResolvedValueOnce(
      new RestResponse({
        statusCode: 409,
        errorMessage: 'Não foi possível confirmar a leitura.',
      }),
    )
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))

    act(() => {
      if (result.current.step === 'reading')
        result.current.props.onAcknowledgeDocument(documents[0].id)
    })

    await waitFor(() => {
      expect(result.current.step).toBe('reading')
      if (result.current.step === 'reading') {
        expect(result.current.props.actionError).toBe(
          'Não foi possível confirmar a leitura.',
        )
        expect(result.current.props.activeDocumentId).toBe(documents[0].id)
      }
    })
  })

  it('acknowledges both documents sequentially before starting the shared envelope', async () => {
    mocks.contextRefetch.mockResolvedValue(readingContext)
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))

    act(() => {
      if (result.current.step === 'reading')
        result.current.props.onAcknowledgeDocument(documents[0].id)
    })
    await waitFor(() => {
      if (result.current.step !== 'reading') throw new Error('Expected reading')
      expect(result.current.props.acknowledgedDocumentIds).toEqual([documents[0].id])
    })

    act(() => {
      if (result.current.step === 'reading')
        result.current.props.onAcknowledgeDocument(documents[1].id)
    })
    await waitFor(() => {
      if (result.current.step !== 'reading') throw new Error('Expected reading')
      expect(result.current.props.acknowledgedDocumentIds).toEqual([
        documents[0].id,
        documents[1].id,
      ])
    })

    expect(mocks.acknowledgeExecute).toHaveBeenNthCalledWith(1, {
      requestDocumentId: documents[0].id,
      expectedRequestVersion: 4,
    })
    expect(mocks.acknowledgeExecute).toHaveBeenNthCalledWith(2, {
      requestDocumentId: documents[1].id,
      expectedRequestVersion: 4,
    })

    act(() => {
      if (result.current.step === 'reading') result.current.props.onContinue()
    })
    await waitFor(() => expect(result.current.step).toBe('provider'))
    expect(mocks.startSigningExecute).toHaveBeenCalledOnce()
    expect(mocks.startSigningExecute).toHaveBeenCalledWith(4)
  })

  it('does not start while any document remains unread', async () => {
    mocks.contextRefetch.mockResolvedValue(readingContext)
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))
    act(() => {
      if (result.current.step === 'reading') result.current.props.onContinue()
    })
    expect(mocks.startSigningExecute).not.toHaveBeenCalled()
  })

  it('starts one shared envelope after all documents are acknowledged', async () => {
    mocks.contextRefetch.mockResolvedValue({
      ...readingContext,
      acknowledgedDocumentIds: documents.map((document) => document.id),
    })
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))
    act(() => {
      if (result.current.step === 'reading') result.current.props.onContinue()
    })
    await waitFor(() => expect(result.current.step).toBe('provider'))
    expect(mocks.startSigningExecute).toHaveBeenCalledOnce()
    expect(mocks.startSigningExecute).toHaveBeenCalledWith(4)
  })

  it('establishes collaborator authority after HMS login', async () => {
    mocks.authSession = { accessToken: 'access' }
    mocks.contextRefetch.mockResolvedValue({
      step: 'collaborator_login',
      loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
      csrfToken: 'csrf',
    } satisfies SignatureGatewayContextDto)
    mocks.collaboratorExecute.mockResolvedValue(
      new RestResponse<SignatureGatewayContextDto>({ body: readingContext }),
    )
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('reading'))
    expect(mocks.collaboratorExecute).toHaveBeenCalledOnce()
  })

  it('keeps the collaborator flow recoverable when the current account is not assigned', async () => {
    mocks.authSession = { accessToken: 'access' }
    mocks.contextRefetch.mockResolvedValue({
      step: 'collaborator_login',
      loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
      csrfToken: 'csrf',
    } satisfies SignatureGatewayContextDto)
    mocks.collaboratorExecute.mockResolvedValue(
      new RestResponse<SignatureGatewayContextDto>({
        statusCode: 403,
        errorMessage: 'Entre com a conta do colaborador atribuído a esta assinatura.',
      }),
    )

    const { result } = renderHook(() => useSigningGatewayPage())

    await waitFor(() => {
      expect(result.current.step).toBe('collaborator_login')
      if (result.current.step === 'collaborator_login')
        expect(result.current.props.error).toBe('account_mismatch')
    })
  })

  it('fails closed when context cannot be restored', async () => {
    mocks.contextRefetch.mockRejectedValue(new Error('Session unavailable'))
    const { result } = renderHook(() => useSigningGatewayPage())
    await waitFor(() => expect(result.current.step).toBe('unavailable'))
  })
})
