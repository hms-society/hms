import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import {
  CaseMemberRole,
  LegalCaseLifecycleStatus,
} from '@hms/core/case-management/domain/structures'
import type {
  CaseAccessProvider,
  CaseClosureAccessProvider,
  CaseCollaboratorsProvider,
  CaseClosureRepository,
} from '@hms/core/case-management/interfaces'
import { GetCaseClosureUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CaseClosureSnapshotResponseDto } from '@/case-management/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { CaseAccessIntent } from '@hms/core/case-management/domain/structures'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetCaseClosureController {
  private readonly useCase: GetCaseClosureUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseClosure)
    closureRepository: CaseClosureRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access)
    private readonly caseAccessProvider: CaseAccessProvider,
    @Inject(CASE_MANAGEMENT_PROVIDERS.caseClosureAccess)
    private readonly accessProvider: CaseClosureAccessProvider,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
  ) {
    this.useCase = new GetCaseClosureUseCase(closureRepository)
  }

  @Get(':caseId/closure')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Case lifecycle, current blockers, closure record and event history.',
    type: CaseClosureSnapshotResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    await this.caseAccessProvider.authorize({
      caseId,
      actorId: actor.collaboratorId,
      intent: CaseAccessIntent.ReadContent,
    })
    const snapshot = await this.useCase.execute({ caseId })
    const access = await this.accessProvider.getActorAccess(caseId, actor.collaboratorId)
    const collaborators = await this.collaboratorsProvider.findByIds([
      ...new Set(snapshot.events.map((event) => event.actorId)),
    ])
    const collaboratorNames = new Map(
      collaborators.map((collaborator) => [
        collaborator.collaboratorId,
        collaborator.professionalName,
      ]),
    )
    const closureActorName = snapshot.closure
      ? (collaboratorNames.get(snapshot.closure.closedBy) ?? 'Colaborador indisponível')
      : undefined
    const canManage =
      access.isAuthenticated &&
      access.isActive &&
      access.isEligible &&
      access.role === CaseMemberRole.Manager
    return {
      ...snapshot,
      closure: snapshot.closure
        ? { ...snapshot.closure, closedByName: closureActorName }
        : undefined,
      events: snapshot.events.map((event) => ({
        ...event,
        actorName: collaboratorNames.get(event.actorId) ?? 'Colaborador indisponível',
      })),
      capabilities: {
        canClose:
          canManage &&
          snapshot.legalCase.lifecycleStatus === LegalCaseLifecycleStatus.Active,
        canReopen:
          canManage &&
          snapshot.legalCase.lifecycleStatus === LegalCaseLifecycleStatus.Closed,
      },
    }
  }
}
