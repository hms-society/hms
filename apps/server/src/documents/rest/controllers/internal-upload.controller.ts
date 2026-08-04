import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Inject,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiResponse, ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger'
import { CreateDocumentBatchUseCase } from '@hms/core/documents/use-cases/create-document-batch-use-case.js'
import { DocumentChannel } from '@hms/core/documents/domain/structures/document-channel.js'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { AuthGuard } from '@/identity/guards'
import { CurrentUser } from '@/identity/decorators'
import type { AuthUser } from '@hms/core/identity/domain/structures'

export interface MulterFile {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

@ApiTags('Document Batches')
@ApiBearerAuth()
@Controller('document-batches')
@UseGuards(AuthGuard)
export class InternalUploadController {
  constructor(
    @Inject(CreateDocumentBatchUseCase)
    private readonly createDocumentBatchUseCase: CreateDocumentBatchUseCase,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  @Post('internal-upload')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lote processado com sucesso.',
  })
  async handle(
    @UploadedFiles() rawFiles: Array<MulterFile>,
    @CurrentUser() authUser: AuthUser,
  ) {
    if (!rawFiles || rawFiles.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.')
    }

    const uploadedFiles = await Promise.all(
      rawFiles.map(async (file) => {
        const timestamp = new Date().getTime()
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `internal/${authUser.id}/${timestamp}-${safeName}`
        await this.storageProvider.upload(storagePath, file.buffer, file.mimetype)
        return {
          storagePath,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        }
      }),
    )

    const batch = await this.createDocumentBatchUseCase.execute({
      channel: DocumentChannel.InternalUpload,
      sender: authUser.email || authUser.id,
      createdBy: authUser.id,
      files: uploadedFiles,
    })

    return {
      id: batch.id,
      readableId: batch.readableId,
      status: batch.status,
      inTriageBox: batch.inTriageBox,
    }
  }
}