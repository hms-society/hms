import { Inject, Injectable } from '@nestjs/common'
import type { WhatsappChannel } from '@hms/core/communication/domain/entities'
import type { WhatsappChannelRepository } from '@hms/core/communication/interfaces'
import { eq, and } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  wabaAccountsModel,
  whatsappChannelsModel,
} from '@/communication/database/drizzle/models/waba-account-model'

@Injectable()
export class DrizzleWhatsappChannelRepository implements WhatsappChannelRepository {
  constructor(
    @Inject(DrizzleClient)
    private readonly drizzle: DrizzleClient,
  ) {}

  private get db() {
    return this.drizzle.requireDatabase()
  }

  async findById(id: string): Promise<WhatsappChannel | undefined> {
    const [row] = await this.db
      .select()
      .from(whatsappChannelsModel)
      .where(eq(whatsappChannelsModel.id, id))
      .limit(1)

    return row ? (row as unknown as WhatsappChannel) : undefined
  }

  async findByLawyerId(lawyerId: string): Promise<WhatsappChannel | undefined> {
    const [row] = await this.db
      .select()
      .from(whatsappChannelsModel)
      .where(
        and(
          eq(whatsappChannelsModel.assignedLawyerId, lawyerId),
          eq(whatsappChannelsModel.status, 'active'),
        ),
      )
      .limit(1)

    return row ? (row as unknown as WhatsappChannel) : undefined
  }

  async findByPhoneNumberId(phoneNumberId: string): Promise<WhatsappChannel | undefined> {
    const [row] = await this.db
      .select()
      .from(whatsappChannelsModel)
      .where(eq(whatsappChannelsModel.phoneNumberId, phoneNumberId))
      .limit(1)

    return row ? (row as unknown as WhatsappChannel) : undefined
  }

  async save(channel: WhatsappChannel): Promise<void> {
    const [wabaAccount] = await this.db
      .select()
      .from(wabaAccountsModel)
      .where(eq(wabaAccountsModel.wabaId, channel.wabaAccountId))
      .limit(1)

    let dbWabaAccountId = wabaAccount?.id

    if (!dbWabaAccountId) {
      const [insertedWaba] = await this.db
        .insert(wabaAccountsModel)
        .values({
          wabaId: channel.wabaAccountId,
          name: channel.verifiedName || 'WABA Account',
          accessToken: 'system_user_token',
          status: 'active',
        })
        .returning()

      dbWabaAccountId = insertedWaba.id
    }

    const [existing] = await this.db
      .select()
      .from(whatsappChannelsModel)
      .where(eq(whatsappChannelsModel.id, channel.id))
      .limit(1)

    if (existing) {
      await this.db
        .update(whatsappChannelsModel)
        .set({
          wabaAccountId: dbWabaAccountId,
          phoneNumberId: channel.phoneNumberId,
          displayPhoneNumber: channel.displayPhoneNumber,
          verifiedName: channel.verifiedName,
          qualityRating: channel.qualityRating,
          assignedLawyerId: channel.assignedLawyerId,
          status: channel.status,
          updatedAt: new Date(),
        })
        .where(eq(whatsappChannelsModel.id, channel.id))
    } else {
      await this.db.insert(whatsappChannelsModel).values({
        id: channel.id,
        wabaAccountId: dbWabaAccountId,
        phoneNumberId: channel.phoneNumberId,
        displayPhoneNumber: channel.displayPhoneNumber,
        verifiedName: channel.verifiedName,
        qualityRating: channel.qualityRating,
        assignedLawyerId: channel.assignedLawyerId,
        status: channel.status,
      })
    }
  }

  async disableChannelByLawyerId(lawyerId: string): Promise<void> {
    await this.db
      .update(whatsappChannelsModel)
      .set({
        status: 'disabled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(whatsappChannelsModel.assignedLawyerId, lawyerId),
          eq(whatsappChannelsModel.status, 'active'),
        ),
      )
  }
}
