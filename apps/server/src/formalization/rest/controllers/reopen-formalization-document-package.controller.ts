import {
  Body,
  HttpCode,
  HttpStatus,
  Inject,
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
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
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
  private readonly useCase: ReopenFormalizationDocumentPackageUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.documentConfirmationTransaction)
    confirmationTransaction: FormalizationDocumentConfirmationTransaction,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ReopenFormalizationDocumentPackageUseCase(
      formalizationsRepository,
      confirmationTransaction,
      datetimeProvider,
    )
  }

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
    return this.useCase.execute({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
