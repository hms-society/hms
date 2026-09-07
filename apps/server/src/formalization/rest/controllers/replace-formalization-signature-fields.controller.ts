import {
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { replaceFormalizationSignatureFieldsSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ReplaceFormalizationSignatureFieldsUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<ReplaceFormalizationSignatureFieldsUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile' | 'documentId'
>

class ReplaceFormalizationSignatureFieldsBody extends createZodDto(
  replaceFormalizationSignatureFieldsSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReplaceFormalizationSignatureFieldsController {
  private readonly useCase: ReplaceFormalizationSignatureFieldsUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    signatureConfigurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    signatureSourceReader: FormalizationSignatureSourceReader,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
  ) {
    this.useCase = new ReplaceFormalizationSignatureFieldsUseCase(
      formalizationsRepository,
      signatureConfigurationRepository,
      signatureSourceReader,
      datetimeProvider,
      idProvider,
    )
  }

  @Put(':formalizationId/signature-configuration/documents/:documentId/fields')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The signature fields were replaced.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body(new ZodValidationPipe(replaceFormalizationSignatureFieldsSchema))
    body: ReplaceFormalizationSignatureFieldsBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      formalizationId,
      documentId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
