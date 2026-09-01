import { Inject, Injectable } from '@nestjs/common'
import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { eq, sql } from 'drizzle-orm'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'
import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import type { StorageProvider } from '@hms/core/shared/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'

import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { documentBatchFileModel } from './drizzle/models'
import { getMimeTypeFromExtension } from '../utils/mime-type.map'

type RealDocumentsSeedReferences = {
  validationScenario?: {
    caseId: string
    checklistItems: readonly {
      id: string
      title: string
    }[]
    clientId: string
  }
}

type ValidationScenarioDocumentLink = {
  checklistItemId: string
  documentFileId: string
  documentFileName: string
}

const REAL_VALIDATION_STATUS_CYCLE = [
  DocumentValidationStatus.Valid,
  DocumentValidationStatus.Incomplete,
  DocumentValidationStatus.Duplicate,
  DocumentValidationStatus.Illegible,
] as const

@Injectable()
export class RealDocumentsSeeder {
  constructor(
    @Inject(DOCUMENT_ENGINE.documentBatches)
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
  ) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()

    await db.execute(sql`
      DELETE FROM document_batches
    `)
  }

  async run(references: RealDocumentsSeedReferences = {}) {
    const db = this.drizzleClient.requireDatabase()

    const { data: clientRecords } = await this.clientsRepository.findAll({
      page: 1,
      limit: 15,
    })

    const clients = clientRecords.map(({ client }) => client)

    if (clients.length === 0) {
      throw new AppError('Nenhum cliente encontrado para criar os documentos.')
    }

    const localPath = 'src/document-engine/database/seed-assets'
    const fileNames = await readdir(localPath)

    if (fileNames.length === 0) {
      throw new AppError(`Nenhum arquivo encontrado em ${localPath}`)
    }

    const batches: any[] = []

    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const dateStringNoDashes = `${year}${month}${day}`

    for (const [index, client] of clients.entries()) {
      const readableId = `LOTE-${dateStringNoDashes}-REAL-${String(index + 1).padStart(2, '0')}`

      const files = await Promise.all(
        fileNames.map(async (fileName) => {
          const fullPath = join(localPath, fileName)

          const fileStat = await stat(fullPath)
          const buffer = await readFile(fullPath)

          const extension = extname(fileName)
          const mimeType = getMimeTypeFromExtension(extension)

          const storagePath = `seed/${client.id}/${readableId}/${fileName}`

          await this.storageProvider.upload(storagePath, buffer, mimeType)

          return {
            storagePath,
            originalName: basename(fileName),
            mimeType,
            sizeBytes: fileStat.size,
          }
        }),
      )

      const batch = await this.documentBatchesRepository.add({
        readableId,
        status: DocumentBatchStatus.Identified,
        channel: DocumentBatchChannel.WhatsApp,
        sender: '5511999999999',
        inTriageBox: false,
        clientId: client.id,
        files,
      })

      await db.execute(sql`
        UPDATE document_batches
        SET created_at = NOW() + INTERVAL '1 day'
        WHERE readable_id = ${readableId}
      `)

      batches.push(batch)

      await Promise.all(
        (batch.files ?? []).map((file, fileIndex) => {
          const status =
            REAL_VALIDATION_STATUS_CYCLE[
              (index + fileIndex) % REAL_VALIDATION_STATUS_CYCLE.length
            ]

          return db
            .update(documentBatchFileModel)
            .set({
              status,
              aiConfidence: status === DocumentValidationStatus.Illegible ? 34 : 90,
              extractedFields:
                status === DocumentValidationStatus.Illegible
                  ? []
                  : [
                      { label: 'Titular', value: 'Mariana Costa Silva' },
                      { label: 'CPF', value: '284.***.***-19' },
                      { label: 'Endereço', value: 'Rua das Palmeiras, 147' },
                      { label: 'CEP', value: '01452-001' },
                    ],
              missingFields:
                status === DocumentValidationStatus.Incomplete ? ['Data de emissão'] : [],
              caseId: undefined,
              checklistItemId: undefined,
              isDuplicate: status === DocumentValidationStatus.Duplicate,
              originalDocumentId:
                status === DocumentValidationStatus.Duplicate ? file.id : undefined,
              aiSuggestion: {
                confidenceLabel: 'Sugerido pela IA',
                documentTypeId: 'comprovante_residencia',
                caseLabel: 'Caso 0089',
                checklistItemLabel: 'Comprovante de residência',
              },
            })
            .where(eq(documentBatchFileModel.id, file.id))
        }),
      )
    }

    if (references.validationScenario) {
      const { batch, documentLinks } = await this.createValidationScenarioBatch(
        references.validationScenario,
        fileNames,
        localPath,
      )
      batches.push(batch)

      return {
        batches,
        validationScenarioDocumentLinks: documentLinks,
      }
    }

    return { batches, validationScenarioDocumentLinks: [] }
  }

  private async createValidationScenarioBatch(
    scenario: NonNullable<RealDocumentsSeedReferences['validationScenario']>,
    fileNames: readonly string[],
    localPath: string,
  ): Promise<{
    batch: Awaited<ReturnType<DocumentBatchesRepository['add']>>
    documentLinks: readonly ValidationScenarioDocumentLink[]
  }> {
    const db = this.drizzleClient.requireDatabase()
    const now = new Date()
    const dateStringNoDashes = now.toISOString().slice(0, 10).replaceAll('-', '')
    const readableId = `LOTE-${dateStringNoDashes}-VINICIUS-CHECKLIST`
    const pdfFileNames = fileNames.filter((fileName) =>
      fileName.toLowerCase().endsWith('.pdf'),
    )

    if (pdfFileNames.length === 0) {
      throw new AppError(
        'Nenhum PDF encontrado para criar o lote documental de validação.',
      )
    }

    const receivedChecklistItems = scenario.checklistItems.slice(0, 2)
    const files = await Promise.all(
      receivedChecklistItems.map(async (_checklistItem, index) => {
        const fileName = pdfFileNames[index % pdfFileNames.length]

        if (!fileName) {
          throw new AppError(
            'Nenhum PDF encontrado para criar o arquivo documental de validação.',
          )
        }

        const fullPath = join(localPath, fileName)
        const fileStat = await stat(fullPath)
        const buffer = await readFile(fullPath)
        const extension = extname(fileName)
        const mimeType = getMimeTypeFromExtension(extension)
        const storagePath = `seed/${scenario.clientId}/${readableId}/${String(
          index + 1,
        ).padStart(2, '0')}-${fileName}`

        await this.storageProvider.upload(storagePath, buffer, mimeType)

        return {
          storagePath,
          originalName: basename(fileName),
          mimeType,
          sizeBytes: fileStat.size,
        }
      }),
    )

    const batch = await this.documentBatchesRepository.add({
      readableId,
      status: DocumentBatchStatus.Identified,
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511987654321',
      inTriageBox: false,
      clientId: scenario.clientId,
      files,
    })

    await Promise.all(
      (batch.files ?? []).map((file, index) => {
        const checklistItem = receivedChecklistItems[index]

        if (!checklistItem) {
          throw new AppError(
            'Item de checklist não encontrado para vincular o arquivo documental.',
          )
        }

        return db
          .update(documentBatchFileModel)
          .set({
            status: DocumentValidationStatus.AwaitingValidation,
            aiConfidence: 96,
            extractedFields: [
              { label: 'Titular', value: 'Vinicius Lopes Machado' },
              { label: 'CPF', value: '123.***.***-09' },
              { label: 'Origem', value: 'Seed de checklist documental' },
            ],
            missingFields: [],
            caseId: scenario.caseId,
            checklistItemId: checklistItem.id,
            isDuplicate: false,
            originalDocumentId: undefined,
            aiSuggestion: {
              confidenceLabel: 'Sugerido pela IA - Confiança alta',
              documentTypeId: 'documento_validacao_seed',
              caseLabel: 'Caso Vinicius Lopes Machado',
              checklistItemId: checklistItem.id,
              checklistItemLabel: checklistItem.title,
            },
          })
          .where(eq(documentBatchFileModel.id, file.id))
      }),
    )

    return {
      batch,
      documentLinks: (batch.files ?? []).flatMap((file, index) => {
        const checklistItem = receivedChecklistItems[index]

        if (!checklistItem) return []

        return {
          checklistItemId: checklistItem.id,
          documentFileId: file.id,
          documentFileName: file.originalName,
        }
      }),
    }
  }
}
