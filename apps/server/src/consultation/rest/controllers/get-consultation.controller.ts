import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { GetConsultationUseCase } from '@hms/core/consultation/use-cases'
import type {
  ClientsRepository,
  CollaboratorsRepository,
} from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type { AppointmentsRepository } from '@hms/core/scheduling/interfaces'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import { ConsultationResponseDto } from '@/consultation/rest/dtos'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetConsultationController {
  private readonly useCase: GetConsultationUseCase

  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
    @Inject(INTAKE_REPOSITORIES.intakes)
    intakesRepository: IntakesRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: AppointmentsRepository,
  ) {
    this.useCase = new GetConsultationUseCase(
      consultationsRepository,
      intakesRepository,
      clientsRepository,
      collaboratorsRepository,
      appointmentsRepository,
    )
  }

  @Get(':consultationId')
  @ApiResponse({ status: HttpStatus.OK, type: ConsultationResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(@Param('consultationId', new ParseUUIDPipe()) consultationId: string) {
    return this.useCase
      .execute({ consultationId })
      .then(ConsultationResponseDto.fromDomain)
  }
}
