import { Inject, Injectable } from '@nestjs/common'
import type { PrivateMessage } from '@hms/core/communication/domain/entities'
import type { CryptoProvider } from '@hms/core/shared/interfaces'
import type { DrizzlePrivateMessage } from '../types/entities/drizzle-private-message'

import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

@Injectable()
export class DrizzlePrivateMessageMapper {
  constructor(
    @Inject(PROVISION_PROVIDERS.crypto)
    private readonly cryptoProvider: CryptoProvider,
  ) {}

  toDomain(record: DrizzlePrivateMessage): PrivateMessage {
    return {
      id: record.id,
      clientId: record.clientId,
      collaboratorId: record.collaboratorId,
      intakeId: record.intakeId,
      clientPhone: record.clientPhone ?? undefined,
      direction: record.direction === 'inbound' ? 'incoming' : 'outgoing',
      content: record.content ? this.cryptoProvider.decrypt(record.content) : undefined,
      fileIds: record.fileIds,
      createdAt: record.createdAt,
    }
  }
}
