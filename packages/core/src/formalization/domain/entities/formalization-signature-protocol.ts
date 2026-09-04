import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureProtocol = Entity & {
  requestId: string
  recipientId: string
  number: string
  artifactSetHash: string
  confirmedAt: Date
}
