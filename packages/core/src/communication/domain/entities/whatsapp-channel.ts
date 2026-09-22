import type { Entity } from '#shared/domain/entities/entity'

export type WhatsappChannelQualityRating = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
export type WhatsappChannelStatus = 'active' | 'disabled'

export type WhatsappChannel = Entity & {
  wabaAccountId: string
  phoneNumberId: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: WhatsappChannelQualityRating
  assignedLawyerId: string
  status: WhatsappChannelStatus
  createdAt: Date
  updatedAt: Date
}
