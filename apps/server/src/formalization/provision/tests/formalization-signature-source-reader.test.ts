import { describe, expect, it, vi } from 'vitest'

import { ConsentType } from '@hms/core/identity/domain/structures'

import { FormalizationSignatureSourceReader } from '../formalization-signature-source-reader'

function createReader(
  client: { id: string; type?: 'natural'; email?: string; phone?: string } | undefined,
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

  it('returns a stable masked authentication channel for a consented email', async () => {
    const { reader } = createReader(
      { id: 'client-id', type: 'natural', email: 'client@example.com' },
      [ConsentType.EmailCommunication],
    )

    await expect(
      reader.listConsentedAuthenticationChannels('client-id'),
    ).resolves.toEqual([
      {
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
        kind: 'email',
        maskedDestination: 'c***@example.com',
      },
    ])
  })

  it('propagates the document specification needed by PDF freezing', async () => {
    const documentPackagesRepository = {
      findByContext: vi.fn().mockResolvedValue({ id: 'package-id' }),
    }
    const packageDocumentsRepository = {
      findByDocumentPackageId: vi.fn().mockResolvedValue([
        {
          documentId: 'document-id',
          documentSpecificationId: 'specification-id',
        },
      ]),
    }
    const documentsRepository = {
      findByIds: vi.fn().mockResolvedValue([
        {
          id: 'document-id',
          title: 'Contract',
          currentVersionId: 'version-id',
        },
      ]),
    }
    const versionsRepository = {
      findByDocumentIds: vi.fn().mockResolvedValue([
        {
          id: 'version-id',
          documentId: 'document-id',
          versionNumber: 2,
          status: 'approved',
          fileId: 'source-file-id',
        },
      ]),
    }
    const reader = new FormalizationSignatureSourceReader(
      {} as never,
      {} as never,
      {} as never,
      documentPackagesRepository as never,
      packageDocumentsRepository as never,
      documentsRepository as never,
      versionsRepository as never,
    )

    await expect(reader.listCurrentDocuments('formalization-id')).resolves.toEqual([
      {
        documentId: 'document-id',
        documentVersionId: 'version-id',
        documentSpecificationId: 'specification-id',
        name: 'Contract',
        reviewStatus: 'approved',
        fileId: 'source-file-id',
      },
    ])
  })
})
