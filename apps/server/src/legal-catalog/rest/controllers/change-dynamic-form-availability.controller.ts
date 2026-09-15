import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type {
  DynamicFormAdministrationAuditRepository,
  DynamicFormAdministrationRepository,
  LegalCatalogDatabase,
} from '@hms/core/legal-catalog/interfaces'
import { ChangeDynamicFormAvailabilityUseCase } from '@hms/core/legal-catalog/use-cases'
import { changeDynamicFormAvailabilitySchema } from '@hms/validation/legal-catalog'
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

type Request = Parameters<ChangeDynamicFormAvailabilityUseCase['execute']>[0]
type RequestBody = Omit<Request, 'dynamicFormId' | 'actorCollaboratorId'>

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ChangeDynamicFormAvailabilityController {
  private readonly useCase: ChangeDynamicFormAvailabilityUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    administrationRepository: DynamicFormAdministrationRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicFormAdministrationAudit)
    auditRepository: DynamicFormAdministrationAuditRepository,
    @Inject(LEGAL_CATALOG_DATABASE) database: LegalCatalogDatabase,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ChangeDynamicFormAvailabilityUseCase(
      administrationRepository,
      auditRepository,
      database,
      idProvider,
      datetimeProvider,
    )
  }

  @Patch('dynamic-forms/:dynamicFormId/availability')
  @ApiResponse({ status: HttpStatus.OK, type: DynamicFormAdministrationResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('dynamicFormId', new ParseUUIDPipe()) dynamicFormId: string,
    @Body(new ZodValidationPipe(changeDynamicFormAvailabilitySchema)) body: RequestBody,
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
