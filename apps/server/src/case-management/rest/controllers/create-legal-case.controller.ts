import { Body, Inject, Post, UseGuards, ForbiddenException } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { createCaseSchema } from '@hms/validation/case-management'
import { CreateLegalCaseUseCase } from '@hms/core/case-management/use-cases'
import type { LegalCase } from '@hms/core/case-management/domain/entities'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ZodValidationPipe } from 'nestjs-zod'
import { CasesController } from '@/case-management/decorators'

@ApiTags('Case Management')
@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CreateLegalCaseController {
  private readonly createLegalCaseUseCase: CreateLegalCaseUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    private readonly legalCasesRepository: LegalCasesRepository,
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
  ) {
    this.createLegalCaseUseCase = new CreateLegalCaseUseCase(
      this.legalCasesRepository,
      this.intakesRepository,
    )
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo caso jurídico' })
  @ApiResponse({ status: 201, description: 'Caso criado com sucesso.' })
  async handle(
    @Body(new ZodValidationPipe(createCaseSchema)) body: any,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<LegalCase> {
    const allowedProfiles = ['admin', 'lawyer', 'paralegal', 'supervisor']
    if (!allowedProfiles.includes(collaborator.profile)) {
      throw new ForbiddenException('You do not have permission to create cases.')
    }

    return this.createLegalCaseUseCase.execute({
      title: body.title,
      intakeId: body.intakeId,
      legalAreaId: body.legalAreaId,
      legalTopicId: body.legalTopicId,
      description: body.description,
      team: body.team,
      actorId: collaborator.collaboratorId,
    })
  }
}
