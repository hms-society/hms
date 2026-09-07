import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureDeliveryStatusModel = pgEnum(
  'formalization_signature_delivery_status',
  ['pending', 'delivered', 'failed'],
)
