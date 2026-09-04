import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureDocumentAcknowledgement = Entity & {
  requestId: string
  requestDocumentId: string
  recipientId: string
  snapshotId: string
  sessionId: string
  acknowledgedAt: Date
  sourceIpHash?: string
  userAgentHash?: string
  createdAt: Date
}
