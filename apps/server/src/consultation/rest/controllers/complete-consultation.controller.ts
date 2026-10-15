import {
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { CompleteConsultationUseCase } from '@hms/core/consultation/use-cases'
import type { DocumentPackagesRepository } from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { Broker } from '@hms/core/shared/interfaces'
import type { AppointmentWriteTransactionProvider } from '@hms/core/shared/interfaces'
import type { ConsultationOutboxRepository } from '@hms/core/consultation/interfaces'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import { ConsultationResponseDto } from '@/consultation/rest/dtos/consultation-response.dto'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CompleteConsultationController {
  private readonly useCase: CompleteConsultationUseCase

  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(InngestBroker) broker: Broker,
    datetimeProvider: DatetimeProvider,
    @Inject(SCHEDULING_REPOSITORIES.appointmentWriteTransactionProvider)
    appointmentTransactionProvider: AppointmentWriteTransactionProvider,
    @Inject(CONSULTATION_REPOSITORIES.outbox)
    outboxRepository: ConsultationOutboxRepository,
    idProvider: IdProvider,
  ) {
    this.useCase = new CompleteConsultationUseCase(
      consultationsRepository,
      documentPackagesRepository,
      broker,
      datetimeProvider,
      appointmentTransactionProvider,
      outboxRepository,
      idProvider,
    )
  }

  @Patch(':consultationId/complete')
  @ApiResponse({ status: HttpStatus.OK, type: ConsultationResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('consultationId', new ParseUUIDPipe()) consultationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        consultationId,
        collaboratorId: collaborator.collaboratorId,
        collaboratorProfile: collaborator.profile,
      })
      .then(ConsultationResponseDto.fromDomain)
  }
}
