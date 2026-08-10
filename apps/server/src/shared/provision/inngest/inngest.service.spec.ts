import { describe, expect, it, vi, beforeEach } from 'vitest'
import { InngestService } from './inngest.service'
import type { WhatsappProvider } from '../../communication/whatsapp.provider'
import type { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

describe('InngestService', () => {
  let inngestService: InngestService
  let mockWhatsappProvider: WhatsappProvider
  let mockDrizzleClient: DrizzleClient
  let mockSelect: any
  let mockInsert: any

  beforeEach(() => {
    mockWhatsappProvider = {} as WhatsappProvider

    mockSelect = vi.fn().mockReturnThis()
    mockInsert = vi.fn().mockReturnThis()

    mockDrizzleClient = {
      requireDatabase: vi.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      }),
    } as unknown as DrizzleClient

    inngestService = new InngestService(mockDrizzleClient, mockWhatsappProvider)
  })

  it('should return configured Inngest functions', () => {
    const functions = inngestService.getFunctions()
    expect(functions).toHaveLength(1)
  })

  it('should process whatsapp/event.received text message for existing client', async () => {
    const fromPhone = '5519971659516'
    const clientId = 'c75a40a8-b648-43e5-8f4b-70c8f583e782'

    // Mock DB queries
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: clientId }]),
        }),
      }),
    })

    const mockValues = vi.fn().mockResolvedValue([])
    mockInsert.mockReturnValue({
      values: mockValues,
    })

    const functions = inngestService.getFunctions()
    const handler = (functions[0] as any).fn

    const mockStep = {
      run: vi.fn().mockImplementation(async (_name, fn) => fn()),
    }

    const event = {
      data: {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: fromPhone,
                      id: 'wamid.123456',
                      type: 'text',
                      text: {
                        body: 'Olá, gostaria de um atendimento.',
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

    await handler({ event, step: mockStep })

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId,
        authorId: null,
        channel: 'whatsapp',
        direction: 'inbound',
        content: 'Olá, gostaria de um atendimento.',
      }),
    )
  })

  it('should warn and not insert communication if client is not found', async () => {
    const fromPhone = '5519999999999'

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })

    const mockValues = vi.fn().mockResolvedValue([])
    mockInsert.mockReturnValue({
      values: mockValues,
    })

    const functions = inngestService.getFunctions()
    const handler = (functions[0] as any).fn

    const mockStep = {
      run: vi.fn().mockImplementation(async (_name, fn) => fn()),
    }

    const event = {
      data: {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: fromPhone,
                      id: 'wamid.123456',
                      type: 'text',
                      text: {
                        body: 'Olá',
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

    await handler({ event, step: mockStep })

    expect(mockValues).not.toHaveBeenCalled()
  })
})
