import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureSnapshot = Entity & {
  formalizationId: string
  formalizationVersion: number
  signatureConfigurationVersion: number
  snapshotHash: string
  createdBy: string
  createdAt: Date
}
