import { Injectable } from '@nestjs/common'
import type { ClientSupporter, SupportersRepository } from '@hms/core/identity/interfaces'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { clientSupporterModel } from '@/identity/database/drizzle/models/client-supporter-model'
import { eq } from 'drizzle-orm'

@Injectable()
export class DrizzleSupportersRepository
  extends DrizzleRepository
  implements SupportersRepository
{
  async findByPhone(phone: string): Promise<ClientSupporter[]> {
    const records = await this.database
      .select()
      .from(clientSupporterModel)
      .where(eq(clientSupporterModel.supporterPhone, phone))

    return records.map((record) => ({
      id: record.id,
      clientId: record.clientId,
      supporterPhone: record.supporterPhone,
      supporterName: record.supporterName,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }))
  }
}
