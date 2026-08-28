import { describe, expect, it, vi } from 'vitest'
import type { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import type { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { ProcessWhatsappEventJob } from '../process-whatsapp-event-job'

describe('ProcessWhatsappEventJob', () => {
  function createMockDrizzle(clientFound: { id: string } | null, eventoId = 'evt-100') {
    const insertValuesMock = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: eventoId }]),
    })

    const limitMock = vi.fn().mockResolvedValue(clientFound ? [clientFound] : [])
    const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
    const fromMock = vi.fn().mockReturnValue({ where: whereMock })
    const selectMock = vi.fn().mockReturnValue({ from: fromMock })

    const mockDb = {
      select: selectMock,
      insert: vi.fn().mockReturnValue({ values: insertValuesMock }),
    }

    const mockDrizzleClient = {
      requireDatabase: vi.fn().mockReturnValue(mockDb),
    } as unknown as DrizzleClient

    return { mockDrizzleClient, mockDb, insertValuesMock }
  }

  function createMockInngest() {
    return {
      createFunction: vi.fn((_config, handler) => handler),
    } as unknown as InngestClient
  }

  it('1. Recusa e descarta mídia de cliente NÃO cadastrado (Gatekeeping na Borda)', async () => {
    const { mockDrizzleClient, insertValuesMock } = createMockDrizzle(null)
    const mockInngest = createMockInngest()
    const job = new ProcessWhatsappEventJob(mockInngest, mockDrizzleClient)

    const sendEventMock = vi.fn()
    const mockStep = {
      run: vi.fn(async (_name, fn) => fn()),
      sendEvent: sendEventMock,
    }

    const event = {
      data: {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      type: 'document',
                      from: '5511988887777',
                      document: {
                        id: 'doc-unknown',
                        mime_type: 'application/pdf',
                        filename: 'comprovante.pdf',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    }

    const handler = job.function as any
    await handler({ event, step: mockStep })

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provedor: 'whatsapp',
        status: 'falha_definitiva',
        erro: 'Rejeitado: Número desconhecido, não vinculado a um cliente HMS.',
      }),
    )

    expect(sendEventMock).not.toHaveBeenCalled()
  })

  it('2. Processa imagens enviadas por cliente cadastrado (.jpg, .png, .jpeg, .webp)', async () => {
    const { mockDrizzleClient, insertValuesMock } = createMockDrizzle({
      id: 'client-active-1',
    })
    const mockInngest = createMockInngest()
    const job = new ProcessWhatsappEventJob(mockInngest, mockDrizzleClient)

    const sendEventMock = vi.fn()
    const mockStep = {
      run: vi.fn(async (_name, fn) => fn()),
      sendEvent: sendEventMock,
    }

    const event = {
      data: {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      type: 'image',
                      from: '5511999991111',
                      image: {
                        id: 'img-1',
                        mime_type: 'image/jpeg',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    }

    const handler = job.function as any
    await handler({ event, step: mockStep })

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provedor: 'whatsapp',
        status: 'recebido',
      }),
    )

    expect(sendEventMock).toHaveBeenCalledWith('dispatch-document-batches', [
      {
        name: 'documents/whatsapp.batch.received',
        data: {
          eventoId: 'evt-100',
          sender: '5511999991111',
          clientId: 'client-active-1',
          mediaId: 'img-1',
          mimeType: 'image/jpeg',
          originalName: 'img-1.jpeg',
        },
      },
    ])
  })

  it('3. Processa envio por terceiro cadastrado repassando o cliente correspondente', async () => {
    const { mockDrizzleClient } = createMockDrizzle({ id: 'client-third-party-99' })
    const mockInngest = createMockInngest()
    const job = new ProcessWhatsappEventJob(mockInngest, mockDrizzleClient)

    const sendEventMock = vi.fn()
    const mockStep = {
      run: vi.fn(async (_name, fn) => fn()),
      sendEvent: sendEventMock,
    }

    const event = {
      data: {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      type: 'document',
                      from: '5511977776666',
                      document: {
                        id: 'doc-third',
                        mime_type: 'application/pdf',
                        filename: 'procuracao_familiar.pdf',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    }

    const handler = job.function as any
    await handler({ event, step: mockStep })

    expect(sendEventMock).toHaveBeenCalledWith('dispatch-document-batches', [
      {
        name: 'documents/whatsapp.batch.received',
        data: {
          eventoId: 'evt-100',
          sender: '5511977776666',
          clientId: 'client-third-party-99',
          mediaId: 'doc-third',
          mimeType: 'application/pdf',
          originalName: 'procuracao_familiar.pdf',
        },
      },
    ])
  })

  it('4. Processa múltiplos documentos e mídias de diferentes tipos em um único payload', async () => {
    const { mockDrizzleClient } = createMockDrizzle({ id: 'client-multi-doc' })
    const mockInngest = createMockInngest()
    const job = new ProcessWhatsappEventJob(mockInngest, mockDrizzleClient)

    const sendEventMock = vi.fn()
    const mockStep = {
      run: vi.fn(async (_name, fn) => fn()),
      sendEvent: sendEventMock,
    }

    const event = {
      data: {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      type: 'document',
                      from: '5511955554444',
                      document: {
                        id: 'doc-1',
                        mime_type: 'application/pdf',
                        filename: 'rg.pdf',
                      },
                    },
                    {
                      type: 'image',
                      from: '5511955554444',
                      image: {
                        id: 'img-2',
                        mime_type: 'image/png',
                      },
                    },
                    {
                      type: 'image',
                      from: '5511955554444',
                      image: {
                        id: 'img-3',
                        mime_type: 'image/webp',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    }

    const handler = job.function as any
    await handler({ event, step: mockStep })

    expect(sendEventMock).toHaveBeenCalledTimes(1)
    expect(sendEventMock).toHaveBeenCalledWith('dispatch-document-batches', [
      {
        name: 'documents/whatsapp.batch.received',
        data: {
          eventoId: 'evt-100',
          sender: '5511955554444',
          clientId: 'client-multi-doc',
          mediaId: 'doc-1',
          mimeType: 'application/pdf',
          originalName: 'rg.pdf',
        },
      },
      {
        name: 'documents/whatsapp.batch.received',
        data: {
          eventoId: 'evt-100',
          sender: '5511955554444',
          clientId: 'client-multi-doc',
          mediaId: 'img-2',
          mimeType: 'image/png',
          originalName: 'img-2.png',
        },
      },
      {
        name: 'documents/whatsapp.batch.received',
        data: {
          eventoId: 'evt-100',
          sender: '5511955554444',
          clientId: 'client-multi-doc',
          mediaId: 'img-3',
          mimeType: 'image/webp',
          originalName: 'img-3.webp',
        },
      },
    ])
  })
})
