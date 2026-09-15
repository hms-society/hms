import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { SendCommunicationController } from '../send-communication.controller'

describe('SendCommunicationController', () => {
  let controller: SendCommunicationController
  let drizzleClientMock: any
  let whatsappProviderMock: any
  let envProviderMock: any

  beforeEach(() => {
    whatsappProviderMock = {
      sendTemplateMessage: vi
        .fn()
        .mockResolvedValue({ externalMessageId: 'meta-msg-123' }),
      sendTextMessage: vi.fn().mockResolvedValue({ externalMessageId: 'meta-msg-456' }),
    }

    envProviderMock = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'WHATSAPP_START_WINDOW_TEMPLATE_NAME') {
          return 'inicio_atendimento_ola'
        }
        return undefined
      }),
    }
  })

  it('rejects type: template for non-whatsapp channels', async () => {
    drizzleClientMock = {
      requireDatabase: vi.fn().mockReturnValue({}),
    }
    controller = new SendCommunicationController(
      drizzleClientMock,
      whatsappProviderMock,
      envProviderMock,
    )

    await expect(
      controller.handle(
        {
          clientId: '00000000-0000-0000-0000-000000000001',
          content: 'Olá',
          channel: 'email',
          type: 'template',
        },
        { user: { id: 'user-1', email: 'admin@hms.com' } },
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it('throws NotFoundException if client does not exist', async () => {
    const selectMock = vi.fn().mockReturnThis()
    const fromMock = vi.fn().mockReturnThis()
    const whereMock = vi.fn().mockReturnThis()
    const limitMock = vi.fn().mockResolvedValue([])

    drizzleClientMock = {
      requireDatabase: vi.fn().mockReturnValue({
        select: selectMock,
        from: fromMock,
        where: whereMock,
        limit: limitMock,
      }),
    }

    controller = new SendCommunicationController(
      drizzleClientMock,
      whatsappProviderMock,
      envProviderMock,
    )

    await expect(
      controller.handle(
        {
          clientId: '00000000-0000-0000-0000-000000000001',
          content: 'Olá',
          channel: 'whatsapp',
        },
        { user: { id: 'user-1', email: 'admin@hms.com' } },
      ),
    ).rejects.toThrow(NotFoundException)
  })
})
