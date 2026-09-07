import { Inject, Injectable } from '@nestjs/common'
import { SignatureProviderUnavailableError } from '@hms/core/formalization/domain/errors'
import type {
  SensitivePayloadCipherProvider,
  SignatureProvider,
} from '@hms/core/formalization/interfaces'
import type {
  FormalizationSignatureArtifactKind,
  FormalizationSignatureProviderEnvelopeStatus,
  FormalizationSignatureRecipientStatus,
} from '@hms/core/formalization/domain/structures'

import { FormalizationSensitivePayloadCipherProvider } from '@/formalization/provision/formalization-signature-crypto.providers'
import { EnvProvider } from '@/shared/provision/env/env-provider'

type JsonObject = Record<string, unknown>

class DocumensoHttpError extends Error {
  constructor(readonly status: number) {
    super('Documenso API request failed')
  }
}

type RequestOptions = {
  method?: string
  body?: BodyInit
  json?: boolean
  allowNotFound?: boolean
  captureHttpStatus?: boolean
}

@Injectable()
export class DocumensoSignatureProvider implements SignatureProvider {
  constructor(
    private readonly env: EnvProvider,
    @Inject(FormalizationSensitivePayloadCipherProvider)
    private readonly cipher: SensitivePayloadCipherProvider,
  ) {}

  getContractVersion() {
    return this.env.get('DOCUMENSO_EXPECTED_VERSION')
  }

  async createEnvelope(input: Parameters<SignatureProvider['createEnvelope']>[0]) {
    const documentIndexes = new Map(
      input.documents.map((document, index) => [document.externalId, index]),
    )
    const payload = {
      type: 'DOCUMENT',
      title: input.title,
      externalId: input.externalId,
      meta: {
        distributionMethod: 'NONE',
        language: 'pt-BR',
      },
      recipients: input.recipients.map((recipient) => ({
        externalId: recipient.externalId,
        email: recipient.email,
        name: recipient.name,
        role: 'SIGNER',
        fields: recipient.fields.map((field) => ({
          identifier: documentIndexes.get(field.documentExternalId) ?? -1,
          type: 'SIGNATURE',
          page: field.page,
          positionX: field.x,
          positionY: field.y,
          width: field.width,
          height: field.height,
        })),
      })),
    }
    if (
      payload.recipients.some((recipient) =>
        recipient.fields.some((field) => field.identifier < 0),
      )
    ) {
      throw new SignatureProviderUnavailableError()
    }
    const form = new FormData()
    form.append('payload', JSON.stringify(payload))
    for (const document of input.documents)
      form.append(
        'files',
        new Blob([new Uint8Array(document.bytes).buffer as ArrayBuffer], {
          type: document.mediaType,
        }),
        `${document.externalId}.pdf`,
      )
    const result = await this.request<JsonObject>('/envelope/create', {
      method: 'POST',
      body: form,
    })
    const providerEnvelopeId = this.string(result.id)
    if (!providerEnvelopeId) throw new SignatureProviderUnavailableError()
    const recipients = this.array(result.recipients).map((recipient) => ({
      externalId: this.string(recipient.externalId) ?? '',
      providerRecipientId: this.string(recipient.id) ?? '',
      rawSigningCredential: this.string(recipient.token) ?? '',
    }))
    if (
      recipients.length === 0 ||
      recipients.some(
        (recipient) =>
          !recipient.externalId ||
          !recipient.providerRecipientId ||
          !recipient.rawSigningCredential,
      )
    ) {
      return this.readEnvelope(providerEnvelopeId, {
        documents: input.documents,
        recipients: input.recipients,
      })
    }
    const documents = this.mapDocuments(result, input.documents)
    if (documents.length !== input.documents.length)
      return this.readEnvelope(providerEnvelopeId, {
        documents: input.documents,
        recipients: input.recipients,
      })
    return { providerEnvelopeId, documents, recipients }
  }

  async findEnvelopeByExternalId(
    externalId: string,
    expected?: {
      documents: ReadonlyArray<{ externalId: string }>
      recipients: ReadonlyArray<{ externalId: string }>
    },
  ) {
    const result = await this.request<JsonObject>('/envelope?type=DOCUMENT&perPage=100')
    const envelope = this.array(result.data).find(
      (candidate) => candidate.externalId === externalId,
    )
    if (!envelope) return null
    return this.readEnvelope(this.string(envelope.id) ?? '', expected)
  }

  private async readEnvelope(
    providerEnvelopeId: string,
    expected?: {
      documents: ReadonlyArray<{ externalId: string }>
      recipients: ReadonlyArray<{ externalId: string }>
    },
  ) {
    let lastError: unknown
    for (const delay of [0, 100, 200, 400, 800, 1_200]) {
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      const envelope = await this.request<JsonObject>(
        `/envelope/${encodeURIComponent(providerEnvelopeId)}`,
      )
      try {
        return this.mapEnvelope(providerEnvelopeId, envelope, expected)
      } catch (error) {
        lastError = error
      }
    }
    throw lastError instanceof Error ? lastError : new SignatureProviderUnavailableError()
  }

  async distributeEnvelope(
    input: Parameters<SignatureProvider['distributeEnvelope']>[0],
  ) {
    const envelope = await this.request<JsonObject>(
      `/envelope/${encodeURIComponent(input.providerEnvelopeId)}`,
    )
    if (this.string(envelope.status) !== 'DRAFT') return

    await this.request('/envelope/distribute', {
      method: 'POST',
      body: JSON.stringify({
        envelopeId: input.providerEnvelopeId,
        meta: { distributionMethod: 'NONE', language: 'pt-BR' },
      }),
      json: true,
    })
  }

  async cancelEnvelope(input: Parameters<SignatureProvider['cancelEnvelope']>[0]) {
    const envelope = await this.request<JsonObject>(
      `/envelope/${encodeURIComponent(input.providerEnvelopeId)}`,
      { allowNotFound: true },
    )
    if (!envelope) return 'already_terminal' as const
    const status = this.string(envelope.status)
    if (
      status === 'DRAFT' ||
      status === 'CANCELLED' ||
      status === 'COMPLETED' ||
      status === 'REJECTED'
    )
      return 'already_terminal' as const
    await this.request('/envelope/cancel', {
      method: 'POST',
      body: JSON.stringify({ envelopeId: input.providerEnvelopeId }),
      json: true,
    })
    return 'cancelled' as const
  }

  async findEnvelopeState(input: Parameters<SignatureProvider['findEnvelopeState']>[0]) {
    const envelope = await this.request<JsonObject>(
      `/envelope/${encodeURIComponent(input.providerEnvelopeId)}`,
    )
    const status = (this.string(envelope.status) ?? '').toUpperCase()
    const envelopeStatus: FormalizationSignatureProviderEnvelopeStatus =
      status === 'COMPLETED'
        ? 'completed'
        : status === 'REJECTED'
          ? 'rejected'
          : status === 'CANCELLED'
            ? 'cancelled'
            : status === 'EXPIRED'
              ? 'expired'
              : status === 'DRAFT'
                ? 'draft'
                : status === 'PENDING'
                  ? 'pending'
                  : 'in_progress'
    const envelopeItems = this.array(envelope.envelopeItems)
    const fields = this.array(envelope.fields)
    return {
      providerEnvelopeId: input.providerEnvelopeId,
      envelopeStatus,
      recipients: this.array(envelope.recipients).map((recipient) => {
        const signingStatus = (this.string(recipient.signingStatus) ?? '').toUpperCase()
        const recipientStatus: FormalizationSignatureRecipientStatus =
          signingStatus === 'SIGNED'
            ? 'confirmed'
            : signingStatus === 'REJECTED'
              ? 'rejected'
              : envelopeStatus === 'cancelled'
                ? 'cancelled'
                : 'invited'
        return {
          providerRecipientId: this.string(recipient.id) ?? '',
          recipientStatus,
          items: envelopeItems.map((item) => {
            const providerEnvelopeItemId = this.string(item.id) ?? ''
            const itemFields = fields.filter(
              (field) =>
                this.string(field.recipientId) === this.string(recipient.id) &&
                this.string(field.envelopeItemId) === providerEnvelopeItemId,
            )
            const isRequired = itemFields.length > 0
            return {
              providerEnvelopeItemId,
              assignment: isRequired ? ('required' as const) : ('not_required' as const),
              status: !isRequired
                ? ('pending' as const)
                : signingStatus === 'SIGNED'
                  ? ('completed' as const)
                  : envelopeStatus === 'cancelled'
                    ? ('cancelled' as const)
                    : ('pending' as const),
              requiredFieldCount: itemFields.length,
              completedFieldCount: itemFields.filter((field) => field.inserted === true)
                .length,
            }
          }),
        }
      }),
      occurredAt: new Date(),
      receivedAt: new Date(),
    }
  }

  async createSigningBinding(
    input: Parameters<SignatureProvider['createSigningBinding']>[0],
  ) {
    const recipient = await this.request<JsonObject>(
      `/envelope/recipient/${encodeURIComponent(input.providerRecipientId)}`,
    )
    const token = this.string(recipient.token)
    if (!token) throw new SignatureProviderUnavailableError()
    const encrypted = await this.cipher.encrypt({
      plaintext: new TextEncoder().encode(token),
      purpose: 'provider_credential',
      contextId: input.recipientId,
    })
    return {
      encryptedCredential: encrypted.ciphertext,
      cipherKeyId: encrypted.keyId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }

  async downloadCompletedArtifacts(
    input: Parameters<SignatureProvider['downloadCompletedArtifacts']>[0],
  ) {
    return Promise.all(
      input.documents.map(async (document) => {
        const response = await this.requestResponse(
          `/envelope/item/${encodeURIComponent(document.providerEnvelopeItemId)}/download?version=signed`,
        )
        const bytes = new Uint8Array(await response.arrayBuffer())
        if (
          bytes.byteLength < 4 ||
          new TextDecoder().decode(bytes.slice(0, 4)) !== '%PDF'
        )
          throw new SignatureProviderUnavailableError()
        return {
          kind: 'signed_pdf' as FormalizationSignatureArtifactKind,
          bytes,
          requestDocumentId: document.requestDocumentId,
          mediaType: 'application/pdf',
          providerReference: document.providerEnvelopeItemId,
        }
      }),
    )
  }

  private async request<T = void>(path: string, options: RequestOptions = {}) {
    try {
      const response = await this.requestResponse(path, {
        ...options,
        captureHttpStatus: true,
      })
      if (response.status === 204) return undefined as T
      const body = (await response.json()) as T
      return body
    } catch (error) {
      if (
        options.allowNotFound &&
        error instanceof DocumensoHttpError &&
        error.status === 404
      ) {
        return undefined as T
      }
      if (error instanceof SignatureProviderUnavailableError) throw error
      throw new SignatureProviderUnavailableError()
    }
  }

  private async requestResponse(path: string, options: RequestOptions = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)
    try {
      const headers = new Headers({ Authorization: this.env.get('DOCUMENSO_API_V2_KEY') })
      if (options.json) headers.set('content-type', 'application/json')
      const response = await fetch(`${this.apiBaseUrl()}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body,
        signal: controller.signal,
      })
      if (!response.ok) {
        if (options.captureHttpStatus) throw new DocumensoHttpError(response.status)
        throw new SignatureProviderUnavailableError()
      }
      return response
    } catch (error) {
      if (
        error instanceof DocumensoHttpError ||
        error instanceof SignatureProviderUnavailableError
      )
        throw error
      throw new SignatureProviderUnavailableError()
    } finally {
      clearTimeout(timeout)
    }
  }

  private apiBaseUrl() {
    const base = this.env.get('DOCUMENSO_PRIVATE_BASE_URL').replace(/\/$/, '')
    return base.endsWith('/api/v2') ? base : `${base}/api/v2`
  }

  private mapEnvelope(
    providerEnvelopeId: string,
    envelope: JsonObject,
    expected?: {
      documents: ReadonlyArray<{ externalId: string }>
      recipients: ReadonlyArray<{ externalId: string }>
    },
  ) {
    const recipients = this.array(envelope.recipients).map((recipient, index) => ({
      externalId:
        this.string(recipient.externalId) ??
        expected?.recipients[index]?.externalId ??
        '',
      providerRecipientId: this.string(recipient.id) ?? '',
      rawSigningCredential: this.string(recipient.token) ?? '',
    }))
    const hasIncompleteRecipient = recipients.some(
      (recipient) =>
        !recipient.externalId ||
        !recipient.providerRecipientId ||
        !recipient.rawSigningCredential,
    )
    if (
      !providerEnvelopeId ||
      recipients.length === 0 ||
      (expected && recipients.length !== expected.recipients.length) ||
      hasIncompleteRecipient
    ) {
      throw new SignatureProviderUnavailableError()
    }
    const documents = this.mapDocuments(envelope, expected?.documents)
    if (expected && documents.length !== expected.documents.length)
      throw new SignatureProviderUnavailableError()
    return { providerEnvelopeId, documents, recipients }
  }

  private mapDocuments(
    envelope: JsonObject,
    expected?: ReadonlyArray<{ externalId: string }>,
  ) {
    const envelopeItems = this.array(envelope.envelopeItems)
    const documents =
      envelopeItems.length > 0 ? envelopeItems : this.array(envelope.documents)

    return documents
      .map((document, index) => ({
        externalId:
          this.string(document.externalId) ?? expected?.[index]?.externalId ?? '',
        providerEnvelopeItemId: this.string(document.id) ?? '',
      }))
      .filter((document) => document.externalId && document.providerEnvelopeItemId)
  }

  private array(value: unknown): JsonObject[] {
    return Array.isArray(value)
      ? value.filter(
          (item): item is JsonObject => typeof item === 'object' && item !== null,
        )
      : []
  }

  private string(value: unknown) {
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : undefined
  }
}
