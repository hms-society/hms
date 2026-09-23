import { describe, expect, it, vi } from 'vitest'
import { RegisterWabaAccountController } from '../register-waba-account.controller'
import { ForbiddenException } from '@nestjs/common'

describe('RegisterWabaAccountController', () => {
  const mockRegisterWabaAccountUseCase: any = {
    execute: vi.fn(),
  }

  const mockUsersRepository: any = {
    findById: vi.fn(),
  }

  const mockCollaboratorsRepository: any = {
    findByUserId: vi.fn(),
  }

  it('should allow Admin to exchange code and register WABA channel', async () => {
    mockUsersRepository.findById.mockResolvedValue({
      id: 'admin-user-id',
      status: 'active',
    })

    mockCollaboratorsRepository.findByUserId.mockResolvedValue({
      id: 'admin-collaborator-id',
      userId: 'admin-user-id',
      profile: 'admin',
    })

    mockRegisterWabaAccountUseCase.execute.mockResolvedValue({
      id: 'channel-123',
      wabaAccountId: 'waba_123',
      phoneNumberId: 'phone_456',
      displayPhoneNumber: '+5511999998888',
      verifiedName: 'Advocacia HMS',
      qualityRating: 'GREEN',
      assignedLawyerId: 'lawyer-uuid-123',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const controller = new RegisterWabaAccountController(
      mockRegisterWabaAccountUseCase,
      mockUsersRepository,
      mockCollaboratorsRepository,
    )

    const req = {
      user: { id: 'admin-user-id' },
    }

    const body = {
      lawyerId: '123e4567-e89b-12d3-a456-426614174000',
      code: 'valid_meta_code',
      wabaId: 'waba_123',
      phoneNumberId: 'phone_456',
    }

    const response = await controller.handle(body, req)

    expect(response.id).toBe('channel-123')
    expect(response.status).toBe('active')
    expect(mockRegisterWabaAccountUseCase.execute).toHaveBeenCalledWith({
      lawyerId: '123e4567-e89b-12d3-a456-426614174000',
      code: 'valid_meta_code',
      wabaId: 'waba_123',
      phoneNumberId: 'phone_456',
    })
  })

  it('should throw ForbiddenException for non-Admin users', async () => {
    mockUsersRepository.findById.mockResolvedValue({
      id: 'lawyer-user-id',
      status: 'active',
    })

    mockCollaboratorsRepository.findByUserId.mockResolvedValue({
      id: 'lawyer-collaborator-id',
      userId: 'lawyer-user-id',
      profile: 'lawyer', // Non-admin profile
    })

    const controller = new RegisterWabaAccountController(
      mockRegisterWabaAccountUseCase,
      mockUsersRepository,
      mockCollaboratorsRepository,
    )

    const req = {
      user: { id: 'lawyer-user-id' },
    }

    const body = {
      lawyerId: '123e4567-e89b-12d3-a456-426614174000',
      code: 'valid_meta_code',
      wabaId: 'waba_123',
      phoneNumberId: 'phone_456',
    }

    await expect(controller.handle(body, req)).rejects.toThrow(ForbiddenException)
  })
})
