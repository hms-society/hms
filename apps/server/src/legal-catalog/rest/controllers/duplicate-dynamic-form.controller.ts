import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type {
  DynamicFormAdministrationAuditRepository,
  DynamicFormAdministrationRepository,
  DynamicFormDuplicateOperationsRepository,
  LegalCatalogDatabase,
} from '@hms/core/legal-catalog/interfaces'
import { DuplicateDynamicFormUseCase } from '@hms/core/legal-catalog/use-cases'
import { duplicateDynamicFormSchema } from '@hms/validation/legal-catalog'
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

type Request = Parameters<DuplicateDynamicFormUseCase['execute']>[0]
type RequestBody = Omit<Request, 'dynamicFormId' | 'actorCollaboratorId'>

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class DuplicateDynamicFormController {
  private readonly useCase: DuplicateDynamicFormUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    administrationRepository: DynamicFormAdministrationRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicFormDuplicateOperations)
    duplicateOperationsRepository: DynamicFormDuplicateOperationsRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicFormAdministrationAudit)
    auditRepository: DynamicFormAdministrationAuditRepository,
    @Inject(LEGAL_CATALOG_DATABASE) database: LegalCatalogDatabase,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new DuplicateDynamicFormUseCase(
      administrationRepository,
      duplicateOperationsRepository,
      auditRepository,
      database,
      idProvider,
      datetimeProvider,
    )
  }

  @Post('dynamic-forms/:dynamicFormId/duplicates')
  @ApiResponse({ status: HttpStatus.CREATED, type: DynamicFormAdministrationResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('dynamicFormId', new ParseUUIDPipe()) dynamicFormId: string,
    @Body(new ZodValidationPipe(duplicateDynamicFormSchema)) body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        ...body,
        dynamicFormId,
        actorCollaboratorId: collaborator.collaboratorId,
      })
      .then(DynamicFormAdministrationResponseDto.fromDomain)
  }
}
