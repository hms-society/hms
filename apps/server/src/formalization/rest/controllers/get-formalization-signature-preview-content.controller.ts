import {
  Get,
  Header,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiProduces, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationSignaturePreviewContentController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Get(':formalizationId/signature-configuration/previews/:previewId/content')
  @ApiProduces('application/pdf')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The private PDF preview was returned.',
    content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  async handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('previewId', new ParseUUIDPipe()) previewId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    const storedFile = await this.service.getSignaturePreviewContent({
      formalizationId,
      previewId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })

    return new StreamableFile(Buffer.from(storedFile.content), {
      type: 'application/pdf',
      disposition: `inline; filename="${this.getSafeFileName(storedFile.file.fileName)}"`,
      length: storedFile.content.byteLength,
    })
  }

  private getSafeFileName(fileName: string) {
    const safeFileName = fileName.replace(/[\r\n"]/g, '_').trim()
    return safeFileName || 'signature-preview.pdf'
  }
}
