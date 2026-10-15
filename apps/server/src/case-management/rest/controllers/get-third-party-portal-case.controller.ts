import {
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { CasePortalAccessGrant } from '@hms/core/case-management/domain/entities'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { GetThirdPartyPortalCaseUseCase } from '@hms/core/case-management/use-cases'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type { ClientsRepository } from '@hms/core/identity/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentPortalAccessGrant } from '@/case-management/rest/decorators/current-portal-access-grant.decorator'
import { RouteAccess } from '@/identity/decorators/route-access.decorator'
import { ApplicationAccessGuard } from '@/identity/guards/application-access.guard'

@Controller('third-party-portal')
@RouteAccess('case-portal')
@UseGuards(ApplicationAccessGuard)
export class GetThirdPartyPortalCaseController {
  private readonly useCase: GetThirdPartyPortalCaseUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
  ) {
    this.useCase = new GetThirdPartyPortalCaseUseCase(
      legalCasesRepository,
      clientsRepository,
    )
  }

  @Get('cases/:caseId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The third-party portal case summary was returned.',
  })
  async handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentPortalAccessGrant() grant: CasePortalAccessGrant,
  ) {
    if (!grant.thirdPartyId) {
      throw new ForbiddenException('This portal link is not assigned to a third party')
    }

    if (!grant.canViewCaseStatus && !grant.canViewIntakeStatus && !grant.canUpload) {
      throw new ForbiddenException(
        'The third party is not authorized to view this portal',
      )
    }

    const caseView = await this.useCase.execute({ caseId, grant })
    const response = {
      caseId: caseView.caseId,
      publicCode: caseView.publicCode,
      title: caseView.title,
      clientName: caseView.clientName,
      canUpload: caseView.canUpload,
      canViewCaseStatus: caseView.canViewCaseStatus,
      canViewIntakeStatus: caseView.canViewIntakeStatus,
      ...(grant.canViewCaseStatus
        ? { status: caseView.status, updatedAt: caseView.updatedAt }
        : {}),
    }
    if (!grant.canViewIntakeStatus) return response

    const intake = caseView.intakeId
      ? await this.intakesRepository.findById(caseView.intakeId)
      : undefined
    return {
      ...response,
      intakeId: caseView.intakeId,
      intake: intake
        ? { id: intake.id, status: intake.status, updatedAt: intake.updatedAt }
        : undefined,
    }
  }
}
