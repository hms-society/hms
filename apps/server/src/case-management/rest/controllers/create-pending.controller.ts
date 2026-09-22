import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { CreatePendingUseCase } from '@hms/core/case-management/use-cases'
import type { PendingsRepository } from '@hms/core/case-management/interfaces'
import { createZodDto } from 'nestjs-zod'
import { createPendingSchema } from '@hms/validation/case-management'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class CreatePendingRequestBody extends createZodDto(createPendingSchema) {}

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CreatePendingController {
  private readonly useCase: CreatePendingUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.pendings) repository: PendingsRepository,
  ) {
    this.useCase = new CreatePendingUseCase(repository)
  }

  @Post(':caseId/pendencies')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The pending document and assisted message were created.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() body: CreatePendingRequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...body,
      caseId,
      responsibleId: collaborator.collaboratorId,
    })
  }
}
