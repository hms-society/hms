import { Injectable } from '@nestjs/common'
import { AssistedMessageStatus } from '@hms/core/case-management/domain/structures'
import type { AssistedMessage, Pending } from '@hms/core/case-management/domain/entities'
import type { PendingsRepository } from '@hms/core/case-management/interfaces'
import { eq } from 'drizzle-orm'
import {
  assistedMessageModel,
  pendingAiErrorModel,
  pendingModel,
} from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzlePendingsRepository extends DrizzleRepository implements PendingsRepository {
  async createWithMessage({ pending, message }: Parameters<PendingsRepository['createWithMessage']>[0]) {
    return this.database.transaction(async (transaction) => {
      const [createdPending] = await transaction.insert(pendingModel).values(pending).returning()
      if (!createdPending) throw new Error('Não foi possível criar a pendência.')
      const [createdMessage] = await transaction.insert(assistedMessageModel).values({ ...message, pendingId: createdPending.id }).returning()
      if (!createdMessage) throw new Error('Não foi possível criar a mensagem assistida.')
      return { pending: toPending(createdPending), message: toMessage(createdMessage) }
    })
  }

  async listByCaseId(caseId: string) {
    const pendings = await this.database.select().from(pendingModel).where(eq(pendingModel.caseId, caseId))
    return pendings.map(toPending)
  }

  async findById(pendingId: string) {
    const [pending] = await this.database.select().from(pendingModel).where(eq(pendingModel.id, pendingId))
    return pending ? toPending(pending) : undefined
  }

  async cancel(pendingId: string, cancelledBy: string) {
    const [pending] = await this.database.update(pendingModel).set({ cancelledAt: new Date(), cancelledBy }).where(eq(pendingModel.id, pendingId)).returning()
    await this.database.update(assistedMessageModel).set({ status: AssistedMessageStatus.Cancelled, updatedAt: new Date() }).where(eq(assistedMessageModel.pendingId, pendingId))
    return pending ? toPending(pending) : undefined
  }

  async updateMessage(pendingId: string, changes: Parameters<PendingsRepository['updateMessage']>[1]) {
    const [message] = await this.database.update(assistedMessageModel).set({ ...changes, updatedAt: new Date() }).where(eq(assistedMessageModel.pendingId, pendingId)).returning()
    return message ? toMessage(message) : undefined
  }

  async findMessageByPendingId(pendingId: string) {
    const [message] = await this.database.select().from(assistedMessageModel).where(eq(assistedMessageModel.pendingId, pendingId))
    return message ? toMessage(message) : undefined
  }

  async approveMessage(pendingId: string, approvedBy: string) {
    const [message] = await this.database.update(assistedMessageModel).set({ status: AssistedMessageStatus.Approved, approvedAt: new Date(), approvedBy, updatedAt: new Date() }).where(eq(assistedMessageModel.pendingId, pendingId)).returning()
    return message ? toMessage(message) : undefined
  }

  async recordAiError(params: Parameters<PendingsRepository['recordAiError']>[0]) {
    await this.database.insert(pendingAiErrorModel).values({ ...params })
  }

  async removeAll() {
    await this.database.delete(pendingAiErrorModel)
    await this.database.delete(assistedMessageModel)
    await this.database.delete(pendingModel)
  }
}

function toPending(record: typeof pendingModel.$inferSelect): Pending {
  return {
    ...record,
    documentFileId: record.documentFileId ?? undefined,
    documentFileName: record.documentFileName ?? undefined,
    details: record.details ?? undefined,
    cancelledAt: record.cancelledAt ?? undefined,
    cancelledBy: record.cancelledBy ?? undefined,
    reason: record.reason as Pending['reason'],
  }
}

function toMessage(record: typeof assistedMessageModel.$inferSelect): AssistedMessage {
  return {
    ...record,
    status: record.status as AssistedMessage['status'],
    approvedAt: record.approvedAt ?? undefined,
    approvedBy: record.approvedBy ?? undefined,
  }
}
