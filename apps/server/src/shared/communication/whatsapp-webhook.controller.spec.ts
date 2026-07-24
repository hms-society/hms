import { describe, expect, it, vi, beforeEach } from 'vitest'
import { WhatsappWebhookController } from './whatsapp-webhook.controller'
import { EnvProvider } from '../provision/env/env-provider'
import type { Request, Response } from 'express'
import { ForbiddenException, HttpStatus } from '@nestjs/common'
import { createHmac } from 'node:crypto'

describe('WhatsappWebhookController', () => {
  let controller: WhatsappWebhookController
  let mockEnvProvider: EnvProvider

  beforeEach(() => {
    mockEnvProvider = {
      get: vi.fn((key: string) => {
        if (key === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') return 'verify-token-123'
        if (key === 'WHATSAPP_APP_SECRET') return 'secret-456'
        return ''
      }),
    } as unknown as EnvProvider

    controller = new WhatsappWebhookController(mockEnvProvider)
  })

  describe('verifyWebhook (GET)', () => {
    it('should successfully verify the webhook and return the challenge', () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        type: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as Response

      controller.verifyWebhook('subscribe', 'challenge_str_123', 'verify-token-123', mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK)
      expect(mockResponse.type).toHaveBeenCalledWith('text/plain')
      expect(mockResponse.send).toHaveBeenCalledWith('challenge_str_123')
    })

    it('should throw ForbiddenException if verify token does not match', () => {
      const mockResponse = {
        status: vi.fn().mockReturnThis(),
        type: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as Response

      expect(() =>
        controller.verifyWebhook('subscribe', 'challenge_str_123', 'wrong-token', mockResponse),
      ).toThrow(ForbiddenException)
    })
  })

  describe('handleWebhook (POST)', () => {
    it('should successfully process a valid payload with correct signature', () => {
      const payload = { object: 'whatsapp_business_account', entry: [] }
      const payloadString = JSON.stringify(payload)
      const rawBody = Buffer.from(payloadString)

      const expectedHash = createHmac('sha256', 'secret-456').update(rawBody).digest('hex')
      const signature = `sha256=${expectedHash}`

      const mockRequest = {
        headers: {
          'x-hub-signature-256': signature,
        },
        rawBody,
        body: payload,
      } as unknown as Request

      const result = controller.handleWebhook(mockRequest)

      expect(result).toEqual({ status: 'success' })
    })

    it('should throw ForbiddenException if x-hub-signature-256 header is missing', () => {
      const mockRequest = {
        headers: {},
        rawBody: Buffer.from(''),
        body: {},
      } as unknown as Request

      expect(() => controller.handleWebhook(mockRequest)).toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException if signature does not match', () => {
      const rawBody = Buffer.from('some payload')
      const mockRequest = {
        headers: {
          'x-hub-signature-256': 'sha256=invalidsignaturehere',
        },
        rawBody,
        body: {},
      } as unknown as Request

      expect(() => controller.handleWebhook(mockRequest)).toThrow(ForbiddenException)
    })
  })
})
