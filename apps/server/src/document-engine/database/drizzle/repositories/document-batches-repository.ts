import { Inject, Injectable } from '@nestjs/common'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type {
  CreateDocumentBatchFileRecord,
  CreateDocumentBatchRecord,
  DocumentBatchesRepository,
  PaginatedTriageBatches,
} from '@hms/core/document-engine/interfaces'
import type {
  DocumentBatch,
  DocumentBatchFile,
} from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { documentBatchModel, documentBatchFileModel } from '../models'
import { DrizzleDocumentBatchMapper } from '../mappers/drizzle-document-batch-mapper'
import { and, asc, count, desc, eq, gte, inArray, lt } from 'drizzle-orm'
import { AppError } from '@hms/core/shared/domain/errors'

@Injectable()
export class DrizzleDocumentBatchesRepository
  extends DrizzleRepository
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
          status: batch.status as any,
          channel: batch.channel as any,
          sender: batch.sender,
          inTriageBox: batch.inTriageBox,
          clientId: batch.clientId,
          intakeId: batch.intakeId,
          createdBy: batch.createdBy,
        })
        .returning()

      if (!createdBatch) {
        throw new AppError(
          'Não foi possível criar o lote documental.',
          'Erro de Lote Documental',
        )
      }

      let createdFiles: (typeof documentBatchFileModel.$inferSelect)[] = []

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

  async addFiles(
    batchId: string,
    files: CreateDocumentBatchFileRecord[],
  ): Promise<DocumentBatch> {
    if (files.length > 0) {
      await this.database.insert(documentBatchFileModel).values(
        files.map((file) => ({
          ...file,
          batchId,
        })),
      )
    }

    return this.findRequiredBatchById(batchId)
  }

  async findDailyByClient(
    clientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DocumentBatch | undefined> {
    const [batch] = await this.database
      .select()
      .from(documentBatchModel)
      .where(
        and(
          eq(documentBatchModel.clientId, clientId),
          gte(documentBatchModel.createdAt, startDate),
          lt(documentBatchModel.createdAt, endDate),
        ),
      )
      .orderBy(asc(documentBatchModel.createdAt))
      .limit(1)

    if (!batch) {
      return undefined
    }

    return this.findRequiredBatchById(batch.id)
  }

  async findById(clientId: string): Promise<DocumentBatch[]> {
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

    const records = batches
      .map((batch) => ({
        ...batch,
        files: files.filter(
          (f) =>
            f.batchId === batch.id &&
            f.status !== DocumentValidationStatus.Duplicate,
        ),
      }))
      .filter((batch) => batch.files.length > 0)

    return records.map((record) => this.mapper.toDomain(record as any))
  }

  async findTriageBatches(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedTriageBatches> {
    const page = Math.max(1, params?.page ?? 1)
    const limit = Math.max(1, Math.min(100, params?.limit ?? 20))
    const offset = (page - 1) * limit

    const [{ value: totalCount }] = await this.database
      .select({ value: count() })
      .from(documentBatchModel)
      .where(eq(documentBatchModel.inTriageBox, true))

    const total = Number(totalCount ?? 0)

    if (total === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
      }
    }

    const batches = await this.database
      .select()
      .from(documentBatchModel)
      .where(eq(documentBatchModel.inTriageBox, true))
      .orderBy(desc(documentBatchModel.createdAt))
      .limit(limit)
      .offset(offset)

    if (batches.length === 0) {
      return {
        items: [],
        total,
        page,
        limit,
      }
    }

    const batchIds = batches.map((b) => b.id)
    const files = await this.database
      .select()
      .from(documentBatchFileModel)
      .where(inArray(documentBatchFileModel.batchId, batchIds))

    const records = batches.map((batch) => ({
      ...batch,
      files: files.filter((f) => f.batchId === batch.id),
    }))

    const items = records.map((record) => this.mapper.toDomain(record as any))

    return {
      items,
      total,
      page,
      limit,
    }
  }

  async findFileById(fileId: string): Promise<DocumentBatchFile | undefined> {
    const [record] = await this.database
      .select()
      .from(documentBatchFileModel)
      .where(eq(documentBatchFileModel.id, fileId))

    if (!record) {
      return undefined
    }

    return {
      id: record.id,
      batchId: record.batchId,
      storagePath: record.storagePath,
      originalName: record.originalName,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      createdAt: record.createdAt,
    }
  }

  private async findRequiredBatchById(batchId: string) {
    const [batch] = await this.database
      .select()
      .from(documentBatchModel)
      .where(eq(documentBatchModel.id, batchId))

    if (!batch) {
      throw new AppError(
        'O lote documental não foi encontrado após a atualização.',
        'Erro de Lote Documental',
      )
    }

    const files = await this.database
      .select()
      .from(documentBatchFileModel)
      .where(eq(documentBatchFileModel.batchId, batchId))
      .orderBy(asc(documentBatchFileModel.createdAt))

    return this.mapper.toDomain({
      ...batch,
      files,
    } as any)
  }
}
