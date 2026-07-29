export type ClientContact = {
  readonly clientId: string
  readonly phone: string
  readonly email?: string
  readonly whatsappConsentActive: boolean
  readonly emailConsentActive: boolean
  readonly updatedAt: Date
}
