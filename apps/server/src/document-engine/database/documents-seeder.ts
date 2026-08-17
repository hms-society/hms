import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { getMimeTypeFromExtension } from '../utils/mime-type.map'
import { extname } from 'node:path'
import { eq } from 'drizzle-orm'
import { documentBatchFileModel } from './drizzle/models'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

const VALIDATION_STATUS_CYCLE = [
  DocumentValidationStatus.NotLinked,
  DocumentValidationStatus.Valid,
  DocumentValidationStatus.Illegible,
  DocumentValidationStatus.Incomplete,
  DocumentValidationStatus.Duplicate,
  DocumentValidationStatus.ProcessingFailure,
  DocumentValidationStatus.ResendRequested,
] as const

@Injectable()
export class DocumentsSeeder {
  constructor(
    @Inject(CreateDocumentBatchUseCase)
    private readonly createDocumentBatchUseCase: CreateDocumentBatchUseCase,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async clear() {}

  async run() {
    await this.clear()

    const db = this.drizzleClient.requireDatabase()

    const users = await db.select().from(userModel).limit(5)
    const clients = await db.select().from(clientModel).limit(10)

    if (users.length === 0 || clients.length === 0) return null

    const dummyFiles = [
      {
        name: 'contrato_social_simulado.pdf',
        content: 'PDF_DUMMY_CONTENT_123',
      },
      {
        name: 'comprovante_endereco_simulado.jpg',
        content: 'JPG_DUMMY_CONTENT_456',
      },
      {
        name: 'cartao_cnpj.pdf',
        content: 'PDF_DUMMY_CONTENT_789',
      },
      {
        name: 'balanco_patrimonial.pdf',
        content: 'PDF_DUMMY_CONTENT_101',
      },
    ]

    const batches: any[] = []
    const batchesPerClient = 3

    for (const [index, client] of clients.entries()) {
      const user = users[index % users.length]

      for (let batchIndex = 1; batchIndex <= batchesPerClient; batchIndex++) {
        const batchName = `LOTE-${client.id}-${batchIndex}-${randomUUID()}`

        const uploadedFiles = await Promise.all(
          dummyFiles.map(async (file) => {
            const buffer = Buffer.from(file.content)
            const extension = extname(file.name)
            const mimeType = getMimeTypeFromExtension(extension)

            const storagePath = `seed/${client.id}/${batchName}/${file.name}`

            await this.storageProvider.upload(storagePath, buffer, mimeType)

            return {
              storagePath,
              originalName: file.name,
              mimeType,
              sizeBytes: buffer.length,
            }
          }),
        )

        const batch = await this.createDocumentBatchUseCase.execute({
          readableId: batchName,
          channel: DocumentBatchChannel.InternalUpload,
          sender: 'admin@hms.com.br',
          createdBy: user.id,
          clientId: client.id,
          files: uploadedFiles,
        })

        batches.push(batch)

        await Promise.all(
          (batch.files ?? []).map((file, fileIndex) => {
            const status =
              VALIDATION_STATUS_CYCLE[
                (index + batchIndex + fileIndex) % VALIDATION_STATUS_CYCLE.length
              ]

            return db
              .update(documentBatchFileModel)
              .set({
                status,
                aiConfidence:
                  status === DocumentValidationStatus.ProcessingFailure ? 0 : 88,
                extractedFields: this.createExtractedFields(status),
                missingFields:
                  status === DocumentValidationStatus.Incomplete
                    ? ['Data de emissão']
                    : [],
                caseId: undefined,
                checklistItemId: undefined,
                isDuplicate: status === DocumentValidationStatus.Duplicate,
                originalDocumentId:
                  status === DocumentValidationStatus.Duplicate ? file.id : undefined,
                aiSuggestion: this.createAiSuggestion(status),
              })
              .where(eq(documentBatchFileModel.id, file.id))
          }),
        )
      }
    }

    return batches
  }

  private createExtractedFields(status: DocumentValidationStatus) {
    if (
      status === DocumentValidationStatus.Illegible ||
      status === DocumentValidationStatus.ProcessingFailure
    ) {
      return []
    }

    const fields = [
      { label: 'Titular', value: 'Mariana Costa Silva', confidence: 94 },
      { label: 'CPF', value: '284.***.***-19', confidence: 91 },
      { label: 'Endereço', value: 'Rua das Palmeiras, 147', confidence: 89 },
      { label: 'CEP', value: '01452-001', confidence: 88 },
      { label: 'Data de emissão', value: '04/08/2026', confidence: 83 },
    ]

    if (status === DocumentValidationStatus.Incomplete) {
      return fields.slice(0, 4)
    }

    return fields
  }

  private createAiSuggestion(status: DocumentValidationStatus) {
    if (status === DocumentValidationStatus.ProcessingFailure) {
      return {
        confidenceLabel: 'Falha no processamento',
        failureReason: 'Arquivo protegido por senha',
        failureInstruction:
          'Solicite ao remetente uma nova cópia do arquivo sem proteção por senha.',
      }
    }

    return {
      confidenceLabel:
        status === DocumentValidationStatus.Valid
          ? 'Sugerido pela IA - Confiança alta'
          : 'Sugerido pela IA',
      documentTypeId: 'comprovante_residencia',
      caseLabel: status === DocumentValidationStatus.NotLinked ? undefined : 'Caso 0089',
      checklistItemLabel:
        status === DocumentValidationStatus.NotLinked
          ? undefined
          : 'Comprovante de residência',
      originalDocumentFileName:
        status === DocumentValidationStatus.Duplicate
          ? 'comprovante-residencia.pdf'
          : undefined,
    }
  }
}
