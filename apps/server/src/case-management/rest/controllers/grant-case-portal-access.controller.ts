import {
  BadRequestException,
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  LegalCasesRepository,
  CasePortalAccessGrantsRepository,
} from '@hms/core/case-management/interfaces'
import type { ThirdPartiesRepository } from '@hms/core/identity/interfaces'
import { GrantCasePortalAccessUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import {
  createPortalAccessToken,
  hashPortalAccessToken,
} from '@/case-management/security/portal-access-token'

type RequestBody = {
  canUpload: boolean
  canViewCaseStatus: boolean
  canViewIntakeStatus: boolean
  thirdPartyId?: string
}

@CasesController()
export class GrantCasePortalAccessController {
  private readonly useCase: GrantCasePortalAccessUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    grantsRepository: CasePortalAccessGrantsRepository,
    @Inject(IDENTITY_REPOSITORIES.thirdParties)
    private readonly thirdPartiesRepository: ThirdPartiesRepository,
  ) {
    this.useCase = new GrantCasePortalAccessUseCase(
      legalCasesRepository,
      grantsRepository,
    )
  }

  @Post(':caseId/portal-access')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Case portal access granted.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() body: RequestBody | undefined,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    if (
      !body ||
      typeof body.canUpload !== 'boolean' ||
      typeof body.canViewCaseStatus !== 'boolean' ||
      typeof body.canViewIntakeStatus !== 'boolean'
    ) {
      throw new BadRequestException(
        'Informe as permissões do link no corpo da requisição.',
      )
    }

    if (!body.thirdPartyId) {
      throw new BadRequestException('Selecione um terceiro para gerar o link.')
    }

    if (body.thirdPartyId) {
      const thirdParty = await this.thirdPartiesRepository.findById(body.thirdPartyId)
      if (!thirdParty) {
        throw new BadRequestException('O terceiro informado não foi encontrado.')
      }
      if (thirdParty.status !== 'active') {
        throw new BadRequestException('Terceiros inativos não podem receber links.')
      }
    }

    const accessToken = createPortalAccessToken()

    const grant = await this.useCase.execute({
      caseId,
      thirdPartyId: body.thirdPartyId,
      collaboratorId: collaborator.collaboratorId,
      isAdministrator: collaborator.profile === 'admin',
      canViewCaseStatus: body.canViewCaseStatus,
      canViewIntakeStatus: body.canViewIntakeStatus,
      tokenHash: hashPortalAccessToken(accessToken),
      canUpload: body.canUpload,
      expiresAt: undefined,
    })

    return {
      grantId: grant.id,
      caseId: grant.caseId,
      thirdPartyId: grant.thirdPartyId,
      accessToken,
      portalAccessUrl: `/third-party-portal/cases/${grant.caseId}?portalToken=${accessToken}`,
      expiresAt: grant.expiresAt?.toISOString() ?? null,
      canViewCaseStatus: grant.canViewCaseStatus,
      canViewIntakeStatus: grant.canViewIntakeStatus,
      canUpload: grant.canUpload,
    }
  }
}
