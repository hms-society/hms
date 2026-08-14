import { describe, it, expect, vi } from 'vitest'
import { CheckSupporterPermissionUseCase } from '../check-supporter-permission-use-case'
import type { SupportersRepository } from '../../interfaces/supporters-repository'

describe('CheckSupporterPermissionUseCase', () => {
  it('should return isSupporter: true when an active supporter is found', async () => {
    const supportersRepository: SupportersRepository = {
      findByPhone: vi.fn().mockResolvedValue([
        {
          id: 'supporter-1',
          clientId: 'client-123',
          supporterPhone: '5519999999999',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    }

    const useCase = new CheckSupporterPermissionUseCase(supportersRepository)
    const result = await useCase.execute({ phone: '5519999999999' })

    expect(result.isSupporter).toBe(true)
    expect(result.supporter?.clientId).toBe('client-123')
  })

  it('should return isSupporter: false when no active supporter is found', async () => {
    const supportersRepository: SupportersRepository = {
      findByPhone: vi.fn().mockResolvedValue([
        {
          id: 'supporter-1',
          clientId: 'client-123',
          supporterPhone: '5519999999999',
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    }

    const useCase = new CheckSupporterPermissionUseCase(supportersRepository)
    const result = await useCase.execute({ phone: '5519999999999' })

    expect(result.isSupporter).toBe(false)
  })
})
