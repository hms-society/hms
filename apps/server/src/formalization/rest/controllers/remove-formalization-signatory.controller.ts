import {
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { removeFormalizationSignatorySchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { RemoveFormalizationSignatoryUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { Inject } from '@nestjs/common'

type RequestBody = Omit<
  Parameters<RemoveFormalizationSignatoryUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile' | 'signatoryId'
>

class RemoveFormalizationSignatoryBody extends createZodDto(
  removeFormalizationSignatorySchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class RemoveFormalizationSignatoryController {
  private readonly useCase: RemoveFormalizationSignatoryUseCase

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
    this.useCase = new RemoveFormalizationSignatoryUseCase(
      formalizationsRepository,
      signatureConfigurationRepository,
      signatureSourceReader,
      datetimeProvider,
      idProvider,
    )
  }

  @Delete(':formalizationId/signature-configuration/signatories/:signatoryId')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, description: 'The signatory was removed.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('signatoryId', new ParseUUIDPipe()) signatoryId: string,
    @Body(new ZodValidationPipe(removeFormalizationSignatorySchema))
    body: RemoveFormalizationSignatoryBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      formalizationId,
      signatoryId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
