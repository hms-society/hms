import { describe, expect, it, vi } from 'vitest'

import type { EnvProvider } from '@/shared/provision/env/env-provider'

import { FormalizationSignatureEmailDeliveryProvider } from '../formalization-signature-email-delivery-provider'

function createDelivery(
  emailProvider = { sendMessage: vi.fn() },
  decryptedValue = JSON.stringify({ token: 'invitation-token' }),
) {
  const expiresAt = new Date(Date.now() + 60_000)
  const delivery = new FormalizationSignatureEmailDeliveryProvider(
    {
      findById: vi.fn().mockResolvedValue({
        id: 'invitation-id',
        recipientId: 'recipient-id',
        status: 'active',
        expiresAt,
      }),
    } as never,
    {
      findById: vi.fn().mockResolvedValue({
        id: 'recipient-id',
        personId: 'person-id',
      }),
    } as never,
    {
      findCurrentByInvitationId: vi.fn().mockResolvedValue({
        id: 'correlation-id',
        status: 'pending_delivery',
        expiresAt,
      }),
    } as never,
    {
      findById: vi.fn().mockResolvedValue({
        id: 'person-id',
        type: 'natural',
        email: 'recipient@example.com',
      }),
    } as never,
    {
      findActiveByClientIdAndType: vi.fn().mockResolvedValue({ id: 'consent-id' }),
    } as never,
    {} as never,
    {
      decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode(decryptedValue)),
    } as never,
    emailProvider as never,
    {
      get: vi.fn((key: string) =>
        key === 'HMS_WEB_APP_URL' ? 'https://app.hms.test' : undefined,
      ),
    } as unknown as EnvProvider,
  )

  return { delivery, expiresAt, emailProvider }
}

describe('FormalizationSignatureEmailDeliveryProvider', () => {
  it('renders the invitation HTML while retaining the plaintext fallback', async () => {
    const emailProvider = {
      sendMessage: vi.fn().mockResolvedValue({ externalMessageId: 'message-id' }),
    }
    const { delivery, expiresAt } = createDelivery(emailProvider)

    await expect(
      delivery.sendInvitation({
        version: 1,
        deliveryAttemptId: 'attempt-id',
        invitationId: 'invitation-id',
        recipientId: 'recipient-id',
        personId: 'person-id',
        channel: 'email',
        encryptedPayload: 'encrypted-payload',
        cipherKeyId: 'local',
        expiresAt: expiresAt.toISOString(),
        correlationId: 'correlation-id',
      }),
    ).resolves.toEqual({ outcome: 'delivered', messageId: 'message-id' })

    const [message] = emailProvider.sendMessage.mock.calls[0]
    expect(message.text).toContain('Acesse o convite:')
    expect(message.html).toContain('https://app.hms.test/assinaturas/acesso')
    expect(message.html).toContain('#invitation-token')
    expect(message.html).not.toContain('%7B')
    expect(message.html).not.toContain('{{invitationLink}}')
    expect(message.html).toContain(expiresAt.toISOString())
  })

  it('does not deliver an invitation with a malformed decrypted payload', async () => {
    const emailProvider = { sendMessage: vi.fn() }
    const { delivery, expiresAt } = createDelivery(emailProvider, 'invitation-token')

    await expect(
      delivery.sendInvitation({
        version: 1,
        deliveryAttemptId: 'attempt-id',
        invitationId: 'invitation-id',
        recipientId: 'recipient-id',
        personId: 'person-id',
        channel: 'email',
        encryptedPayload: 'encrypted-payload',
        cipherKeyId: 'local',
        expiresAt: expiresAt.toISOString(),
        correlationId: 'correlation-id',
      }),
    ).resolves.toEqual({ outcome: 'failed' })
    expect(emailProvider.sendMessage).not.toHaveBeenCalled()
  })

  it('escapes every value rendered into the static HTML template', async () => {
    const { delivery } = createDelivery()
    const renderTemplate = (
      delivery as unknown as {
        renderTemplate(fileName: string, values: Record<string, string>): Promise<string>
      }
    ).renderTemplate.bind(delivery)

    const html = await renderTemplate('formalization-signature-invitation.html', {
      invitationLink: 'https://example.test/?a=1&b="quoted"<script>',
      expiresAt: 'soon & <script>alert(1)</script>',
    })

    expect(html).toContain(
      'https://example.test/?a=1&amp;b=&quot;quoted&quot;&lt;script&gt;',
    )
    expect(html).toContain('soon &amp; &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).not.toContain('{{')
  })

  it('renders the OTP HTML with the same concise plaintext fallback', async () => {
    const emailProvider = {
      sendMessage: vi.fn().mockResolvedValue({ externalMessageId: 'message-id' }),
    }
    const { delivery, expiresAt } = createDelivery(emailProvider, '123456')

    await expect(
      delivery.sendOtp({
        version: 1,
        deliveryAttemptId: 'attempt-id',
        invitationId: 'invitation-id',
        channel: 'email',
        encryptedPayload: 'encrypted-payload',
        cipherKeyId: 'local',
        expiresAt: expiresAt.toISOString(),
        correlationId: 'correlation-id',
      }),
    ).resolves.toEqual({ outcome: 'delivered', messageId: 'message-id' })

    const [message] = emailProvider.sendMessage.mock.calls[0]
    expect(message.text).toContain('123456')
    expect(message.html).toContain('>123456</td>')
    expect(message.html).not.toContain('{{code}}')
    expect(message.html).not.toContain('{{expiresAt}}')
  })
})
