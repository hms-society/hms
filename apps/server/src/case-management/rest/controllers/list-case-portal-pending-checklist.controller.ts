import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiQuery, ApiResponse } from '@nestjs/swagger'
import type {
  CaseChecklistItemsRepository,
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { ListCasePortalPendingChecklistUseCase } from '@hms/core/case-management/use-cases'
import type { CasePortalAccessGrant } from '@hms/core/case-management/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CaseChecklistItemResponseDto } from '@/case-management/rest/dtos'
import { RouteAccess } from '@/identity/decorators/route-access.decorator'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { CurrentPortalAccessGrant } from '@/case-management/rest/decorators/current-portal-access-grant.decorator'

@CasesController()
@RouteAccess('case-portal')
export class ListCasePortalPendingChecklistController {
  private readonly useCase: ListCasePortalPendingChecklistUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    caseChecklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    grantsRepository: CasePortalAccessGrantsRepository,
  ) {
    this.useCase = new ListCasePortalPendingChecklistUseCase(
      legalCasesRepository,
      caseChecklistItemsRepository,
      grantsRepository,
    )
  }

  @Get(':caseId/portal-pendencies')
  @ApiQuery({ name: 'portalToken', required: true, description: 'Token do link do Portal.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The pending documents for the authorized case.',
    type: [CaseChecklistItemResponseDto],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentPortalAccessGrant() grant: CasePortalAccessGrant,
  ) {
    return this.useCase.execute({ caseId, tokenHash: grant.tokenHash })
  }
}
