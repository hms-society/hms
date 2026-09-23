import type { UseCase } from '#shared/interfaces/use-case'
import type { WhatsappChannel } from '../domain/entities'
import type {
  WhatsappChannelRepository,
  MetaCloudApiClient,
} from '../interfaces'

type Request = {
  readonly lawyerId: string
  readonly code: string
  readonly wabaId: string
  readonly phoneNumberId: string
}

export class RegisterWabaAccountUseCase implements UseCase<Request, WhatsappChannel> {
  constructor(
    private readonly whatsappChannelRepository: WhatsappChannelRepository,
    private readonly metaCloudApiClient: MetaCloudApiClient,
  ) {}

  async execute({
    lawyerId,
    code,
    wabaId,
    phoneNumberId,
  }: Request): Promise<WhatsappChannel> {
    const { accessToken } = await this.metaCloudApiClient.exchangeCodeForToken(code)

    const phoneDetails = await this.metaCloudApiClient.getPhoneNumberDetails(
      phoneNumberId,
      accessToken,
    )

    // Disable any existing channel assigned to this lawyer
    await this.whatsappChannelRepository.disableChannelByLawyerId(lawyerId)

    const now = new Date()
    const newChannel: WhatsappChannel = {
      id: crypto.randomUUID(),
      wabaAccountId: wabaId,
      phoneNumberId,
      displayPhoneNumber: phoneDetails.displayPhoneNumber,
      verifiedName: phoneDetails.verifiedName,
      qualityRating: phoneDetails.qualityRating,
      assignedLawyerId: lawyerId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }

    await this.whatsappChannelRepository.save(newChannel)

    return newChannel
  }
}
