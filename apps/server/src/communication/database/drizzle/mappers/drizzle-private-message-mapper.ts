import type { PrivateMessage } from '@hms/core/communication/domain/entities'
import type { DrizzlePrivateMessage } from '../types/entities/drizzle-private-message'

import { decrypt } from '@/shared/utils/crypto'

export class DrizzlePrivateMessageMapper {
  static toDomain(record: DrizzlePrivateMessage): PrivateMessage {
    return {
      id: record.id,
      clientId: record.clientId,
      collaboratorId: record.collaboratorId,
      intakeId: record.intakeId,
      clientPhone: record.clientPhone ?? undefined,
      direction: record.direction === 'inbound' ? 'incoming' : 'outgoing',
      content: record.content ? decrypt(record.content) : undefined,
      fileIds: record.fileIds,
      createdAt: record.createdAt,
    }
  }
}
