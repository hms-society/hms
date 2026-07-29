import type { AutomaticMessageKind } from '../domain/structures'

export type SendWhatsappMessageParams = {
  phone: string
  kind: AutomaticMessageKind
  text: string
  idempotencyKey: string
}
