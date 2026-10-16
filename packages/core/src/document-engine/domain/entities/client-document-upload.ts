import type { Entity } from '#shared/domain/entities/entity'
import type { PrepareChecklistUpload } from '../structures/prepare-checklist-upload'
export type ClientDocumentUpload = Entity &
  PrepareChecklistUpload & {
    storagePath: string
    createdAt: Date
    expiresAt: Date
    clientDocumentId?: string
    publishedAt?: Date
    processingAcceptedAt?: Date
  }
