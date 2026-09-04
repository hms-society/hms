import { describe, expect, it, vi } from 'vitest'

import { ConsentType } from '@hms/core/identity/domain/structures'

import { FormalizationSignatureSourceReader } from '../formalization-signature-source-reader'

function createReader(
  client: { id: string; email?: string; phone?: string } | undefined,
  consentTypes: readonly ConsentType[] = [],
) {
  const clientConsentsRepository = {
    findActiveByClientIdAndType: vi.fn((_: string, type: ConsentType) =>
      Promise.resolve(
        consentTypes.includes(type) ? { id: `${type}-consent`, type } : undefined,
      ),
    ),
  }

  return {
    clientConsentsRepository,
    reader: new FormalizationSignatureSourceReader(
      { findById: vi.fn().mockResolvedValue(client) } as never,
      {} as never,
      clientConsentsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    ),
  }
}

describe('FormalizationSignatureSourceReader', () => {
  it('hides client channels without matching active consent', async () => {
    const { reader, clientConsentsRepository } = createReader({
      id: 'client-id',
      email: 'client@example.com',
      phone: '+5511999999999',
    })

    await expect(reader.findPerson('client-id')).resolves.toMatchObject({
      availableChannels: [],
    })
    expect(clientConsentsRepository.findActiveByClientIdAndType).toHaveBeenCalledTimes(2)
  })

  it('exposes only the consented client email channel', async () => {
    const { reader } = createReader(
      { id: 'client-id', email: 'client@example.com', phone: '+5511999999999' },
      [ConsentType.EmailCommunication],
    )

    await expect(reader.findPerson('client-id')).resolves.toMatchObject({
      availableChannels: ['email'],
    })
  })

  it('exposes WhatsApp only when the phone and its consent are both present', async () => {
    const { reader } = createReader(
      { id: 'client-id', email: 'client@example.com', phone: '+5511999999999' },
      [ConsentType.WhatsappCommunication],
    )

    await expect(reader.findPerson('client-id')).resolves.toMatchObject({
      availableChannels: ['whatsapp'],
    })
  })
})
