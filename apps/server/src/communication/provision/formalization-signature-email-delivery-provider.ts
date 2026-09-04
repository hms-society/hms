import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { Inject, Injectable } from '@nestjs/common'
import { ConsentType } from '@hms/core/identity/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'
import type {
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureRecipientsRepository,
  SensitivePayloadCipherProvider,
} from '@hms/core/formalization/interfaces'
import type {
  ClientConsentsRepository,
  ClientsRepository,
  CollaboratorsRepository,
} from '@hms/core/identity/interfaces'
import type {
  FormalizationSignatureInvitationReadyEventInput,
  FormalizationSignatureOtpDeliveryRequestedEventInput,
} from '@hms/validation/formalization'

import { COMMUNICATION_PROVIDERS } from '@/communication/constants/communication-providers'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import type { EmailProvider } from '@hms/core/communication/interfaces'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { EnvProvider } from '@/shared/provision/env/env-provider'

type DeliveryResult = { outcome: 'delivered'; messageId: string } | { outcome: 'failed' }

const INVITATION_TEMPLATE = 'formalization-signature-invitation.html'
const OTP_TEMPLATE = 'formalization-signature-otp.html'

@Injectable()
export class FormalizationSignatureEmailDeliveryProvider {
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    private readonly invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    private readonly recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpChallenges)
    private readonly challengesRepository: FormalizationSignatureOtpChallengesRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.clientConsents)
    private readonly clientConsentsRepository: ClientConsentsRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
    @Inject(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
    private readonly cipher: SensitivePayloadCipherProvider,
    @Inject(COMMUNICATION_PROVIDERS.email)
    private readonly emailProvider: EmailProvider,
    private readonly env: EnvProvider,
  ) {}

  async sendInvitation(
    event: FormalizationSignatureInvitationReadyEventInput,
  ): Promise<DeliveryResult> {
    const invitation = await this.invitationsRepository.findById(event.invitationId)
    const recipient = await this.recipientsRepository.findById(event.recipientId)
    if (
      !invitation ||
      !recipient ||
      invitation.recipientId !== recipient.id ||
      (event.personId && recipient.personId !== event.personId) ||
      invitation.status !== 'active' ||
      invitation.expiresAt <= new Date() ||
      invitation.expiresAt.toISOString() !== event.expiresAt
    ) {
      return { outcome: 'failed' }
    }

    const email = await this.findConsentedEmail(recipient.personId)
    if (!email) return { outcome: 'failed' }

    const payload = await this.decryptText({
      ciphertext: event.encryptedPayload,
      keyId: event.cipherKeyId,
      purpose: 'invitation_delivery',
      contextId: invitation.id,
    })
    const token = payload ? this.invitationToken(payload) : null
    if (!token) return { outcome: 'failed' }

    const link = this.invitationLink(token)
    const result = await this.emailProvider.sendMessage({
      to: email,
      subject: 'Convite para assinatura de formalização',
      text: [
        'Você recebeu um convite para assinar um documento no HMS.',
        '',
        `Acesse o convite: ${link}`,
        '',
        `Este convite expira em ${event.expiresAt}.`,
      ].join('\n'),
      html: await this.renderTemplate(INVITATION_TEMPLATE, {
        invitationLink: link,
        expiresAt: event.expiresAt,
      }),
      fileIds: [],
      references: [],
      idempotencyKey: `formalization-signature-invitation:${event.deliveryAttemptId}`,
    })
    return { outcome: 'delivered', messageId: result.externalMessageId }
  }

  async sendOtp(
    event: FormalizationSignatureOtpDeliveryRequestedEventInput,
  ): Promise<DeliveryResult> {
    const invitation = await this.invitationsRepository.findById(event.invitationId)
    const challenge = await this.challengesRepository.findCurrentByInvitationId(
      event.invitationId,
    )
    if (
      !invitation ||
      !challenge ||
      challenge.id !== event.correlationId ||
      challenge.status !== 'pending_delivery' ||
      !challenge.expiresAt ||
      challenge.expiresAt <= new Date() ||
      challenge.expiresAt.toISOString() !== event.expiresAt
    ) {
      return { outcome: 'failed' }
    }

    const recipient = await this.recipientsRepository.findById(invitation.recipientId)
    if (!recipient) return { outcome: 'failed' }
    const email = await this.findConsentedEmail(recipient.personId)
    if (!email) return { outcome: 'failed' }

    const code = await this.decryptText({
      ciphertext: event.encryptedPayload,
      keyId: event.cipherKeyId,
      purpose: 'otp_delivery',
      contextId: challenge.id,
    })
    if (!code || !/^\d{6}$/.test(code)) return { outcome: 'failed' }

    const result = await this.emailProvider.sendMessage({
      to: email,
      subject: 'Código para assinatura de formalização',
      text: [
        'Seu código de confirmação para continuar a assinatura no HMS é:',
        '',
        code,
        '',
        `Este código expira em ${event.expiresAt}.`,
      ].join('\n'),
      html: await this.renderTemplate(OTP_TEMPLATE, {
        code,
        expiresAt: event.expiresAt,
      }),
      fileIds: [],
      references: [],
      idempotencyKey: `formalization-signature-otp:${event.deliveryAttemptId}`,
    })
    return { outcome: 'delivered', messageId: result.externalMessageId }
  }

  private async findConsentedEmail(personId: string): Promise<string | null> {
    const client = await this.clientsRepository.findById(personId)
    if (client) {
      if (client.type !== 'natural' || !client.email) return null
      const consent = await this.clientConsentsRepository.findActiveByClientIdAndType(
        client.id,
        ConsentType.EmailCommunication,
      )
      return consent ? client.email.trim() || null : null
    }

    const collaborator = await this.collaboratorsRepository.findSummaryById(personId)
    if (collaborator?.status !== 'active') return null
    return collaborator.email.trim() || null
  }

  private async decryptText(input: {
    ciphertext: string
    keyId: string
    purpose: 'invitation_delivery' | 'otp_delivery'
    contextId: string
  }) {
    try {
      const plaintext = await this.cipher.decrypt(input)
      return new TextDecoder().decode(plaintext)
    } catch {
      return null
    }
  }

  private invitationLink(token: string) {
    const url = new URL('/assinaturas/acesso', this.env.get('HMS_WEB_APP_URL'))
    url.hash = token
    return url.toString()
  }

  private invitationToken(payload: string) {
    try {
      const value: unknown = JSON.parse(payload)
      if (
        typeof value === 'object' &&
        value !== null &&
        'token' in value &&
        typeof value.token === 'string'
      ) {
        return value.token
      }
    } catch {
      return null
    }
    return null
  }

  private async renderTemplate(
    fileName: string,
    values: Record<string, string>,
  ): Promise<string> {
    const template = await this.readTemplate(fileName)

    return Object.entries(values).reduce(
      (rendered, [name, value]) =>
        rendered.replaceAll(`{{${name}}}`, this.escapeHtml(value)),
      template,
    )
  }

  private async readTemplate(fileName: string): Promise<string> {
    const paths = [
      join(process.cwd(), 'templates', 'communication', fileName),
      join(process.cwd(), 'volumes', 'communication', 'templates', fileName),
      join(process.cwd(), '..', '..', 'volumes', 'communication', 'templates', fileName),
    ]

    for (const path of paths) {
      try {
        return await readFile(path, 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw new AppError(
            'O template de e-mail transacional não pôde ser lido.',
            'Erro no Template de E-mail',
          )
        }
      }
    }

    throw new AppError(
      'O template de e-mail transacional não está disponível.',
      'Erro no Template de E-mail',
    )
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character] ?? character,
    )
  }
}
