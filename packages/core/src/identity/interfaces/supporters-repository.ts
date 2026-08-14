export type ClientSupporter = {
  id: string
  clientId: string
  supporterPhone: string
  supporterName?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SupportersRepository {
  findByPhone(phone: string): Promise<ClientSupporter[]>
}
