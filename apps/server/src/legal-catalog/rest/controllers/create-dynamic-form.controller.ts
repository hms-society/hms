import { Body, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type {
  DynamicFormAdministrationAuditRepository,
  DynamicFormAdministrationRepository,
  DynamicFormOperationsRepository,
  LegalAreasRepository,
  LegalCatalogDatabase,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import {
  CreateDynamicFormUseCase,
  ValidateDynamicFormDefinitionUseCase,
} from '@hms/core/legal-catalog/use-cases'
import { createDynamicFormSchema } from '@hms/validation/legal-catalog'
import { ZodValidationPipe } from 'nestjs-zod'

import {
  LEGAL_CATALOG_DATABASE,
  LEGAL_CATALOG_REPOSITORIES,
} from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { DynamicFormAdministrationResponseDto } from '@/legal-catalog/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

type Request = Parameters<CreateDynamicFormUseCase['execute']>[0]
type RequestBody = Omit<Request, 'actorCollaboratorId'>

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class CreateDynamicFormController {
  private readonly useCase: CreateDynamicFormUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    administrationRepository: DynamicFormAdministrationRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicFormOperations)
    operationsRepository: DynamicFormOperationsRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicFormAdministrationAudit)
    auditRepository: DynamicFormAdministrationAuditRepository,
    @Inject(LEGAL_CATALOG_DATABASE) database: LegalCatalogDatabase,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CreateDynamicFormUseCase(
      administrationRepository,
      legalAreasRepository,
      legalTopicsRepository,
      operationsRepository,
      auditRepository,
      database,
      new ValidateDynamicFormDefinitionUseCase(idProvider),
      idProvider,
      datetimeProvider,
    )
  }

  @Post('dynamic-forms')
  @ApiResponse({ status: HttpStatus.CREATED, type: DynamicFormAdministrationResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Body(new ZodValidationPipe(createDynamicFormSchema)) body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({ ...body, actorCollaboratorId: collaborator.collaboratorId })
      .then(DynamicFormAdministrationResponseDto.fromDomain)
  }
}
