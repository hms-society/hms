import {
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { requestFormalizationSignaturePreviewGenerationSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { RequestFormalizationSignaturePreviewGenerationUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<RequestFormalizationSignaturePreviewGenerationUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile' | 'previewId'
>

class RequestFormalizationSignaturePreviewGenerationBody extends createZodDto(
  requestFormalizationSignaturePreviewGenerationSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class RequestFormalizationSignaturePreviewGenerationController {
  private readonly useCase: RequestFormalizationSignaturePreviewGenerationUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    signatureConfigurationRepository: FormalizationSignatureConfigurationRepository,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new RequestFormalizationSignaturePreviewGenerationUseCase(
      formalizationsRepository,
      signatureConfigurationRepository,
      broker,
      datetimeProvider,
    )
  }

  @Post(':formalizationId/signature-configuration/previews/:previewId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The preview generation was requested again.',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('previewId', new ParseUUIDPipe()) previewId: string,
    @Body(new ZodValidationPipe(requestFormalizationSignaturePreviewGenerationSchema))
    body: RequestFormalizationSignaturePreviewGenerationBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      formalizationId,
      previewId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
