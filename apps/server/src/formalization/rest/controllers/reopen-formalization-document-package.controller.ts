import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { reopenFormalizationDocumentPackageSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ReopenFormalizationDocumentPackageUseCase } from '@hms/core/formalization/use-cases'

import { FormalizationApplicationService } from '@/formalization/formalization-application.service'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<ReopenFormalizationDocumentPackageUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile'
>

class ReopenFormalizationDocumentPackageBody extends createZodDto(
  reopenFormalizationDocumentPackageSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReopenFormalizationDocumentPackageController {
  constructor(private readonly service: FormalizationApplicationService) {}

  @Patch(':formalizationId/documents/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document package was reopened.',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(reopenFormalizationDocumentPackageSchema))
    body: ReopenFormalizationDocumentPackageBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.service.reopenDocumentPackage({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
