import { Inject, Injectable } from '@nestjs/common'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type {
  CreateDocumentBatchRecord,
  DocumentBatchesRepository,
} from '@hms/core/documents/interfaces'
import type { DocumentBatch } from '@hms/core/documents/domain/entities'
import { documentBatchModel, documentBatchFileModel } from '../models'
import { DrizzleDocumentBatchMapper } from '../mappers/drizzle-document-batch-mapper'
import { eq, desc, inArray } from 'drizzle-orm' // inArray adicionado

@Injectable()
export class DrizzleDocumentBatchesRepository extends DrizzleRepository
  implements DocumentBatchesRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleDocumentBatchMapper)
    private readonly mapper: DrizzleDocumentBatchMapper,
  ) {
    super(drizzle)
  }

  async add(batch: CreateDocumentBatchRecord): Promise<DocumentBatch> {
    return this.database.transaction(async (tx) => {
      const [createdBatch] = await tx
        .insert(documentBatchModel)
        .values({
          readableId: batch.readableId,
          status: batch.status,
          channel: batch.channel,
          sender: batch.sender,
          inTriageBox: batch.inTriageBox,
          clientId: batch.clientId,
          intakeId: batch.intakeId,
          createdBy: batch.createdBy,
        })
        .returning()

      if (!createdBatch) {
        throw new Error('Failed to create document batch')
      }

      let createdFiles: typeof documentBatchFileModel.$inferSelect[] = []
      
      if (batch.files.length > 0) {
        const filesToInsert = batch.files.map((file) => ({
          ...file,
          batchId: createdBatch.id,
        }))

        createdFiles = await tx
          .insert(documentBatchFileModel)
          .values(filesToInsert)
          .returning()
      }

      return this.mapper.toDomain({
        ...createdBatch,
        files: createdFiles,
      } as any)
    })
  }

  async findById(clientId:string): Promise<DocumentBatch[]> {
    const batches = await this.database
      .select()
      .from(documentBatchModel)
      .where(eq(documentBatchModel.clientId, clientId))
      .orderBy(desc(documentBatchModel.createdAt))

    if (batches.length === 0) return []

    const batchIds = batches.map((b) => b.id)
    const files = await this.database
      .select()
      .from(documentBatchFileModel)
      .where(inArray(documentBatchFileModel.batchId, batchIds))

    const records = batches.map((batch) => ({
      ...batch,
      files: files.filter((f) => f.batchId === batch.id),
    }))

    return records.map((record) => this.mapper.toDomain(record as any))
  }
}