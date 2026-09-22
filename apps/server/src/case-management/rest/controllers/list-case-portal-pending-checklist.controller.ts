import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CaseChecklistItemsRepository,
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { ListCasePortalPendingChecklistUseCase } from '@hms/core/case-management/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CaseChecklistItemResponseDto } from '@/case-management/rest/dtos'
import { CurrentUser } from '@/identity/decorators'
import { RouteAccess } from '@/identity/decorators/route-access.decorator'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@RouteAccess('case-portal')
@ApiBearerAuth()
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The pending documents for the authorized case.',
    type: [CaseChecklistItemResponseDto],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.useCase.execute({ caseId, userId: user.id })
  }
}
