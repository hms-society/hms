import type {
  ExchangeSignatureInvitationCommand,
  RequestSignatureOtpCommand,
  StartFormalizationSigningCommand,
  VerifySignatureOtpCommand,
} from '@hms/core/formalization/domain/structures'
import type { SigningGatewayService as SigningGatewayServiceContract } from '@hms/core/formalization/interfaces'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import {
  requestSignatureOtpSchema,
  signatureGatewayChannelsSchema,
  signatureGatewayContextSchema,
  signatureGatewayDocumentsSchema,
  signatureDocumentAcknowledgementSchema,
  acknowledgeSignatureDocumentSchema,
  signatureResultSchema,
  startSigningSchema,
  verifySignatureOtpSchema,
  exchangeSignatureInvitationSchema,
} from '@hms/validation/formalization'
import { z } from 'zod'

import {
  createSigningGatewayCsrfStore,
  type SigningGatewayCsrfStore,
} from '@/provision/signing-gateway-csrf-store'

export { createSigningGatewayCsrfStore }
export type { SigningGatewayCsrfStore }

const otpResponseSchema = z.strictObject({
  challengeId: z.string().uuid(),
  expiresAt: z.string().datetime({ offset: true }),
  resendAvailableAt: z.string().datetime({ offset: true }),
})

const signingResponseSchema = z.strictObject({
  proxyPath: z.string().startsWith('/assinaturas/provedor/'),
  expiresAt: z.string().datetime({ offset: true }),
})

function header(headers: Record<string, string>, name: string): string | undefined {
  return Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  )?.[1]
}

function parseResponse<Body, ParsedBody>(
  response: RestResponse<Body>,
  schema: z.ZodType<ParsedBody>,
  csrfStore: SigningGatewayCsrfStore,
): RestResponse<ParsedBody> {
  if (response.isFailure) return response as unknown as RestResponse<ParsedBody>

  const parsed = schema.safeParse(response.body)
  if (!parsed.success) {
    return new RestResponse<ParsedBody>({
      statusCode: 422,
      errorMessage: 'Invalid Signing Gateway response.',
      headers: response.headers,
    })
  }

  const csrf = header(response.headers, 'X-HMS-Signing-CSRF')
  if (csrf) csrfStore.replace(csrf)

  return new RestResponse<ParsedBody>({
    body: parsed.data,
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

function options(csrfStore: SigningGatewayCsrfStore) {
  const csrf = csrfStore.get()

  return {
    credentials: 'include' as const,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-HMS-Signing-CSRF': csrf } : {}),
    },
  }
}

export const SigningGatewayService = (
  restClient: RestClient,
  csrfStore: SigningGatewayCsrfStore,
): SigningGatewayServiceContract => ({
  exchangeInvitation(input: ExchangeSignatureInvitationCommand) {
    const parsedInput = exchangeSignatureInvitationSchema.parse(input)
    return restClient
      .post('/formalizations/signing-gateway/invitations/exchange', parsedInput, {
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      })
      .then((response) =>
        parseResponse(response, signatureGatewayContextSchema, csrfStore),
      )
  },

  getContext() {
    return restClient
      .get('/formalizations/signing-gateway/context', options(csrfStore))
      .then((response) =>
        parseResponse(response, signatureGatewayContextSchema, csrfStore),
      )
  },

  listChannels() {
    return restClient
      .get('/formalizations/signing-gateway/channels', options(csrfStore))
      .then((response) =>
        parseResponse(response, signatureGatewayChannelsSchema, csrfStore),
      )
  },

  requestOtp(input: RequestSignatureOtpCommand) {
    const parsedInput = requestSignatureOtpSchema.parse(input)
    return restClient
      .post('/formalizations/signing-gateway/otp', parsedInput, options(csrfStore))
      .then((response) => parseResponse(response, otpResponseSchema, csrfStore))
  },

  verifyOtp(input: VerifySignatureOtpCommand) {
    const parsedInput = verifySignatureOtpSchema.parse(input)
    return restClient
      .post('/formalizations/signing-gateway/otp/verify', parsedInput, options(csrfStore))
      .then((response) =>
        parseResponse(response, signatureGatewayContextSchema, csrfStore),
      )
  },

  establishCollaboratorSession() {
    return restClient
      .post(
        '/formalizations/signing-gateway/collaborator/session',
        undefined,
        options(csrfStore),
      )
      .then((response) =>
        parseResponse(response, signatureGatewayContextSchema, csrfStore),
      )
  },

  getDocuments() {
    return restClient
      .get('/formalizations/signing-gateway/documents', options(csrfStore))
      .then((response) =>
        parseResponse(response, signatureGatewayDocumentsSchema, csrfStore),
      )
  },

  getDocumentContent(requestDocumentId: string) {
    return restClient
      .getFile(
        `/formalizations/signing-gateway/documents/${encodeURIComponent(requestDocumentId)}/content`,
        options(csrfStore),
      )
      .then(async (response) => {
        if (response.isFailure) return response as unknown as RestResponse<ArrayBuffer>
        return new RestResponse<ArrayBuffer>({
          body: await response.body.arrayBuffer(),
          statusCode: response.statusCode,
          headers: response.headers,
        })
      })
  },

  acknowledgeDocument(requestDocumentId, input) {
    const parsedInput = acknowledgeSignatureDocumentSchema.parse(input)
    return restClient
      .post(
        `/formalizations/signing-gateway/documents/${encodeURIComponent(requestDocumentId)}/acknowledgement`,
        parsedInput,
        options(csrfStore),
      )
      .then((response) =>
        parseResponse(response, signatureDocumentAcknowledgementSchema, csrfStore),
      )
  },

  startSigning(input: StartFormalizationSigningCommand) {
    const parsedInput = startSigningSchema.parse(input)
    return restClient
      .post('/formalizations/signing-gateway/signing', parsedInput, options(csrfStore))
      .then((response) => parseResponse(response, signingResponseSchema, csrfStore))
  },

  getResult() {
    return restClient
      .get('/formalizations/signing-gateway/result', options(csrfStore))
      .then((response) => parseResponse(response, signatureResultSchema, csrfStore))
  },

  closeResult() {
    return restClient
      .delete('/formalizations/signing-gateway/result', undefined, options(csrfStore))
      .then((response) => {
        csrfStore.clear()
        return response as RestResponse<void>
      })
  },
})
