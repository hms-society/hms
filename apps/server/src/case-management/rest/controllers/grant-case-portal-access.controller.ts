import {
  BadRequestException,
  Body,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository, CasePortalAccessGrantsRepository } from '@hms/core/case-management/interfaces'
import { GrantCasePortalAccessUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { UsersRepository } from '@hms/core/identity/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

type RequestBody = { userId: string; canUpload: boolean; expiresAt?: string }

@CasesController()
export class GrantCasePortalAccessController {
  private readonly useCase: GrantCasePortalAccessUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    grantsRepository: CasePortalAccessGrantsRepository,
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
  ) {
    this.useCase = new GrantCasePortalAccessUseCase(legalCasesRepository, grantsRepository)
  }

  @Post(':caseId/portal-access')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Case portal access granted.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() body: RequestBody | undefined,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    if (!body?.userId || typeof body.canUpload !== 'boolean') {
      throw new BadRequestException(
        'Informe userId e canUpload no corpo da requisição.',
      )
    }

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('expiresAt deve ser uma data ISO válida.')
    }

    const user = await this.usersRepository.findById(body.userId)
    if (!user || user.status !== 'active') {
      throw new NotFoundException(
        'O usuário terceiro não existe ou não está ativo na tabela users.',
      )
    }

    return this.useCase.execute({
      caseId,
      collaboratorId: collaborator.collaboratorId,
      userId: body.userId,
      canUpload: body.canUpload,
      expiresAt,
    })
  }
}
