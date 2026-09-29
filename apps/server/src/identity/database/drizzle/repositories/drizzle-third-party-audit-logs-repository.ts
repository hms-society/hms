import { Injectable } from '@nestjs/common'
import type {
  ThirdPartyAuditLog,
  ThirdPartyAuditLogsRepository,
} from '@hms/core/identity/interfaces'

import { auditLogModel } from '@/identity/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleThirdPartyAuditLogsRepository
  extends DrizzleRepository
  implements ThirdPartyAuditLogsRepository
{
  async create(log: ThirdPartyAuditLog): Promise<void> {
    await this.database.insert(auditLogModel).values({
      idUsuario: log.actorId,
      perfilUsuario: log.actorProfile,
      entidade: 'third_party',
      idEntidade: log.thirdParty.id,
      campoAlterado: log.action,
      valorAnterior: null,
      valorNovo: JSON.stringify({
        thirdParty: log.thirdParty,
        ...(log.permission ? { permission: log.permission } : {}),
      }),
    })
  }

  // biome-ignore lint/complexity/noUselessConstructor: Nest needs the dependency metadata on this provider.
  constructor(drizzle: DrizzleClient) {
    super(drizzle)
  }
}
