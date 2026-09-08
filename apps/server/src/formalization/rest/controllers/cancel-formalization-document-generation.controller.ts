import { Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { CancelFormalizationDocumentGenerationUseCase } from '@hms/core/formalization/use-cases'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import type { DocumentGenerationsRepository } from '@hms/core/document-production/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { Inject } from '@nestjs/common'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CancelFormalizationDocumentGenerationController {
  private readonly useCase: CancelFormalizationDocumentGenerationUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    datetimeProvider: DatetimeProvider,
    broker: InngestBroker,
  ) {
    this.useCase = new CancelFormalizationDocumentGenerationUseCase(
      formalizationsRepository,
      generationsRepository,
      datetimeProvider,
      broker,
    )
  }

  @Patch(':formalizationId/document-generations/:generationId/cancel')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('generationId', new ParseUUIDPipe()) generationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      formalizationId,
      generationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
