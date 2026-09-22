import type { WhatsappChannel } from '../domain/entities'

export interface WhatsappChannelRepository {
  findById(id: string): Promise<WhatsappChannel | undefined>
  findByLawyerId(lawyerId: string): Promise<WhatsappChannel | undefined>
  findByPhoneNumberId(phoneNumberId: string): Promise<WhatsappChannel | undefined>
  save(channel: WhatsappChannel): Promise<void>
  disableChannelByLawyerId(lawyerId: string): Promise<void>
}
