import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WhatsAppWebhookService } from './whatsapp-webhook.service'
import type { DrizzleDB } from '../../shared/database/database.provider'

describe('WhatsAppWebhookService', () => {
  let service: WhatsAppWebhookService
  let dbMock: any

  beforeEach(() => {
    dbMock = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }

    service = new WhatsAppWebhookService(dbMock as DrizzleDB)
  })

  it('deve registrar um novo evento de webhook com sucesso', async () => {
    dbMock.limit.mockResolvedValue([])
    dbMock.returning.mockResolvedValue([{ id: 'uuid-1234' }])

    const payload = {
      event: 'messages.upsert',
      data: {
        key: { id: 'MSG-001' },
      },
    }

    const result = await service.processWebhook(payload)

    expect(result.received).toBe(true)
    expect(result.duplicate).toBe(false)
    expect(result.id).toBe('uuid-1234')
  })

  it('deve detectar duplicidade e ignorar reprocessamento quando idExterno já existir', async () => {
    dbMock.limit.mockResolvedValue([{ id: 'uuid-existente', idExterno: 'MSG-001' }])

    const payload = {
      event: 'messages.upsert',
      data: {
        key: { id: 'MSG-001' },
      },
    }

    const result = await service.processWebhook(payload)

    expect(result.received).toBe(true)
    expect(result.duplicate).toBe(true)
    expect(result.id).toBe('uuid-existente')
    expect(dbMock.insert).not.toHaveBeenCalled()
  })
})
