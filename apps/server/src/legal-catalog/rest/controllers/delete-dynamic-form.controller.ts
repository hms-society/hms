import {
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type {
  DynamicFormAdministrationAuditRepository,
  DynamicFormAdministrationRepository,
  LegalCatalogDatabase,
} from '@hms/core/legal-catalog/interfaces'
import { DeleteDynamicFormUseCase } from '@hms/core/legal-catalog/use-cases'

import {
  LEGAL_CATALOG_DATABASE,
  LEGAL_CATALOG_REPOSITORIES,
} from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class DeleteDynamicFormController {
  private readonly useCase: DeleteDynamicFormUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    administrationRepository: DynamicFormAdministrationRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicFormAdministrationAudit)
    auditRepository: DynamicFormAdministrationAuditRepository,
    @Inject(LEGAL_CATALOG_DATABASE) database: LegalCatalogDatabase,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new DeleteDynamicFormUseCase(
      administrationRepository,
      auditRepository,
      database,
      idProvider,
      datetimeProvider,
    )
  }

  @Delete('dynamic-forms/:dynamicFormId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The dynamic form was deleted.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Param('dynamicFormId', new ParseUUIDPipe()) dynamicFormId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      dynamicFormId,
      actorCollaboratorId: collaborator.collaboratorId,
    })
  }
}
