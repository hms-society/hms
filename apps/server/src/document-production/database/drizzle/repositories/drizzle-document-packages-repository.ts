import { Injectable } from '@nestjs/common'
import type { DocumentPackageCreation } from '@hms/core/document-production/domain/entities'
import type {DocumentPackagesRepository} from '@hms/core/document-production/interfaces'
import type {SignatureDispatchInfo} from '@hms/core/document-production/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'
import { and, desc, eq } from 'drizzle-orm'

import {
  DrizzleDocumentPackageMapper,
  DrizzlePackageDocumentMapper,
} from '@/document-production/database/drizzle/mappers'
import {
  documentPackageModel,
  packageDocumentModel,
} from '@/document-production/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleDocumentPackagesRepository
  extends DrizzleRepository
  implements DocumentPackagesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleDocumentPackageMapper,
    private readonly packageDocumentMapper: DrizzlePackageDocumentMapper,
  ) {
    super(drizzle)
  }

  async add(documentPackage: DocumentPackageCreation) {
    const [created] = await this.addMany([documentPackage])
    if (!created) {
      throw new AppError(
        'Não foi possível persistir o pacote documental.',
        'Erro de Persistência',
      )
    }
    return created
  }

  async addMany(documentPackages: readonly DocumentPackageCreation[]) {
    if (documentPackages.length === 0) return []

    const records = await this.database
      .insert(documentPackageModel)
      .values(
        documentPackages.map((documentPackage) => ({
          id: documentPackage.id,
          ...this.serializeContext(documentPackage.context),
        })),
      )
      .returning()

    return records.map((record) => this.mapper.toDomain(record))
  }

  async findById(documentPackageId: string) {
    const [record] = await this.database
      .select()
      .from(documentPackageModel)
      .where(eq(documentPackageModel.id, documentPackageId))
      .limit(1)

    return record ? this.mapWithDocuments(record) : undefined
  }

  async findByContext(context: DocumentPackageCreation['context']) {
    const serialized = this.serializeContext(context)
    const [record] = await this.database
      .select()
      .from(documentPackageModel)
      .where(
        and(
          eq(documentPackageModel.contextType, serialized.contextType),
          eq(documentPackageModel.contextId, serialized.contextId),
        ),
      )
      .limit(1)

    return record ? this.mapWithDocuments(record) : undefined
  }

  async removeAll() {
    await this.database.delete(documentPackageModel)
  }

  private serializeContext(context: DocumentPackageCreation['context']) {
    if (context.type === 'consultation') {
      return { contextType: context.type, contextId: context.consultationId }
    }
    if (context.type === 'formalization') {
      return { contextType: context.type, contextId: context.formalizationId }
    }
    return { contextType: context.type, contextId: context.caseId }
  }

  private async mapWithDocuments(record: typeof documentPackageModel.$inferSelect) {
    const documents = await this.database
      .select()
      .from(packageDocumentModel)
      .where(eq(packageDocumentModel.documentPackageId, record.id))

    return this.mapper.toDomain(
      record,
      documents.map((document) => this.packageDocumentMapper.toDomain(document)),
    )
  }

  public async findDispatchInfoByIntakeId(
    intakeId: string,
  ): Promise<SignatureDispatchInfo | null> {
    const [pkg] = await this.database
      .select({
        id: documentPackageModel.id,
        createdAt: documentPackageModel.createdAt,
      })
      .from(documentPackageModel)
      .where(
        and(
          eq(documentPackageModel.contextType, 'formalization'),
          eq(documentPackageModel.contextId, intakeId),
        ),
      )
      .orderBy(desc(documentPackageModel.createdAt))
      .limit(1)

    if (!pkg) {
      return null
    }

    const dispatchDate = new Date(pkg.createdAt)

    const daysSinceSent = Math.max(
      0,
      Math.floor((Date.now() - dispatchDate.getTime()) / (1000 * 60 * 60 * 24)),
    )
    const expirationDays = 15
    const expiresInDays = Math.max(0, expirationDays - daysSinceSent)

    const expirationDate = new Date(dispatchDate)
    expirationDate.setDate(expirationDate.getDate() + expirationDays)
    const expirationDayMonth = expirationDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })

    const sentAtFormatted = dispatchDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const sentAtTime = dispatchDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return {
      sentAt: `${sentAtFormatted} às ${sentAtTime}`,
      sentBy: 'Dr. Hudson M. Silva',
      channel: 'WhatsApp',
      signatoriesCount: '2 pessoas',
      deadline: `15 dias (expira ${expirationDayMonth})`,
      expiresInDays,
      daysSinceSent,
    }
  }
}