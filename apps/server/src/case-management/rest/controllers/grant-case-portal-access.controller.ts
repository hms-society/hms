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
import { GrantCasePortalAccessUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import {
  createPortalAccessToken,
  hashPortalAccessToken,
} from '@/case-management/security/portal-access-token'

type RequestBody = { canUpload: boolean; expiresAt?: string }

@CasesController()
export class GrantCasePortalAccessController {
  private readonly useCase: GrantCasePortalAccessUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    grantsRepository: CasePortalAccessGrantsRepository,
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
    if (!body || typeof body.canUpload !== 'boolean') {
      throw new BadRequestException('Informe canUpload no corpo da requisição.')
    }

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('expiresAt deve ser uma data ISO válida.')
    }

    const accessToken = createPortalAccessToken()
    const effectiveExpiresAt = expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const grant = await this.useCase.execute({
      caseId,
      collaboratorId: collaborator.collaboratorId,
      isAdministrator: collaborator.profile === 'admin',
      tokenHash: hashPortalAccessToken(accessToken),
      canUpload: body.canUpload,
      expiresAt: effectiveExpiresAt,
    })

    return {
      grantId: grant.id,
      caseId: grant.caseId,
      accessToken,
      portalAccessUrl: `/cases/${grant.caseId}/portal-pendencies?portalToken=${accessToken}`,
      expiresAt: grant.expiresAt,
      canUpload: grant.canUpload,
    }
  }
}
