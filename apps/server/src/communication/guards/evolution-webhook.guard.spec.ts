import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EvolutionWebhookGuard } from './evolution-webhook.guard'

describe('EvolutionWebhookGuard', () => {
  let guard: EvolutionWebhookGuard
  let configService: ConfigService

  beforeEach(() => {
    configService = {
      get: vi.fn((key: string) => {
        if (key === 'EVOLUTION_API_KEY') return 'valid-secret-key'
        return undefined
      }),
    } as unknown as ConfigService

    guard = new EvolutionWebhookGuard(configService)
  })

  it('deve permitir a requisição quando a apikey for válida', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { apikey: 'valid-secret-key' },
        }),
      }),
    } as ExecutionContext

    expect(guard.canActivate(mockContext)).toBe(true)
  })

  it('deve rejeitar a requisição quando a apikey for inválida', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { apikey: 'invalid-key' },
        }),
      }),
    } as ExecutionContext

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException)
  })

  it('deve rejeitar a requisição quando a apikey estiver ausente', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as ExecutionContext

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException)
  })
})
