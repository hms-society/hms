import {
  BadRequestException,
  Controller,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '@hms/core/case-management/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentUser } from '@/identity/decorators'
import { RouteAccess } from '@/identity/decorators/route-access.decorator'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf'])
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.pdf'])

type PortalFile = {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

@CasesController()
@RouteAccess('case-portal-upload')
@ApiBearerAuth()
export class UploadCasePortalDocumentController {
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    private readonly legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    private readonly checklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CreateDocumentBatchUseCase)
    private readonly createDocumentBatchUseCase: CreateDocumentBatchUseCase,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {}

  @Post(':caseId/portal-pendencies/:checklistItemId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document uploaded for analysis.' })
  async handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('checklistItemId', new ParseUUIDPipe()) checklistItemId: string,
    @UploadedFile() file: PortalFile | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo foi enviado.')
    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('O arquivo deve ter entre 1 byte e 10 MB.')
    }

    const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Formato inválido. Envie PNG, JPG, JPEG ou PDF.')
    }

    const legalCase = await this.legalCasesRepository.findById(caseId)
    if (!legalCase) throw new BadRequestException('Caso não encontrado.')

    const checklistItems = await this.checklistItemsRepository.listByCaseId(caseId)
    const checklistItem = checklistItems.find((item) => item.id === checklistItemId)
    if (!checklistItem) throw new BadRequestException('Pendência não encontrada neste caso.')

    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `third-party-portal/${caseId}/${Date.now()}-${safeName}`
    await this.storageProvider.upload(storagePath, file.buffer, file.mimetype)

    const batch = await this.createDocumentBatchUseCase.execute({
      channel: DocumentBatchChannel.ThirdPartyPortal,
      sender: user.email ?? user.id,
      createdBy: user.id,
      clientId: legalCase.clientId,
      files: [{
        storagePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }],
    })

    const uploadedFile = batch.files?.[0]
    if (!uploadedFile) throw new BadRequestException('O arquivo não foi registrado.')

    const updatedItem = await this.checklistItemsRepository.markAsInAnalysisByDocument({
      checklistItemId,
      documentFileId: uploadedFile.id,
      documentFileName: uploadedFile.originalName,
    })
    if (!updatedItem) throw new BadRequestException('A pendência não pôde ser atualizada.')

    return {
      protocol: batch.readableId ?? batch.id,
      sentAt: new Date(),
      status: updatedItem.status,
      checklistItemId: updatedItem.id,
    }
  }
}
