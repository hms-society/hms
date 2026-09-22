import { describe, expect, it, vi } from 'vitest'
import { RegisterWabaAccountUseCase } from '../register-waba-account-use-case'
import type {
  WhatsappChannelRepository,
  MetaCloudApiClient,
} from '../../interfaces'
import type { WhatsappChannel } from '../../domain/entities'

describe('RegisterWabaAccountUseCase', () => {
  const mockWhatsappChannelRepository: WhatsappChannelRepository = {
    findById: vi.fn(),
    findByLawyerId: vi.fn(),
    findByPhoneNumberId: vi.fn(),
    save: vi.fn(),
    disableChannelByLawyerId: vi.fn(),
  }

  const mockMetaCloudApiClient: MetaCloudApiClient = {
    exchangeCodeForToken: vi.fn(),
    getPhoneNumberDetails: vi.fn(),
  }

  it('should exchange code with Meta, disable previous channel, and activate new channel for lawyer', async () => {
    vi.mocked(mockMetaCloudApiClient.exchangeCodeForToken).mockResolvedValue({
      accessToken: 'valid_meta_access_token',
      tokenType: 'bearer',
    })

    vi.mocked(mockMetaCloudApiClient.getPhoneNumberDetails).mockResolvedValue({
      displayPhoneNumber: '+5511999998888',
      verifiedName: 'Advocacia HMS',
      qualityRating: 'GREEN',
    })

    const useCase = new RegisterWabaAccountUseCase(
      mockWhatsappChannelRepository,
      mockMetaCloudApiClient,
    )

    const result = await useCase.execute({
      lawyerId: 'lawyer-uuid-123',
      code: 'meta_oauth_code',
      wabaId: 'waba_123456',
      phoneNumberId: 'phone_999999',
    })

    expect(mockMetaCloudApiClient.exchangeCodeForToken).toHaveBeenCalledWith(
      'meta_oauth_code',
    )
    expect(mockMetaCloudApiClient.getPhoneNumberDetails).toHaveBeenCalledWith(
      'phone_999999',
      'valid_meta_access_token',
    )
    expect(
      mockWhatsappChannelRepository.disableChannelByLawyerId,
    ).toHaveBeenCalledWith('lawyer-uuid-123')
    expect(mockWhatsappChannelRepository.save).toHaveBeenCalled()

    expect(result.assignedLawyerId).toBe('lawyer-uuid-123')
    expect(result.phoneNumberId).toBe('phone_999999')
    expect(result.displayPhoneNumber).toBe('+5511999998888')
    expect(result.status).toBe('active')
  })
})
