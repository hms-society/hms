import { Body, Inject, Post, UseGuards, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { createCaseSchema } from '@hms/validation/case-management'
import { CreateLegalCaseUseCase } from '@hms/core/case-management/use-cases'
import type { LegalCase } from '@hms/core/case-management/domain/entities'
import type {
  CaseIdentityTransaction,
  DatetimeProvider as DatetimeProviderContract,
} from '@hms/core/shared/interfaces'
import type {
  CaseCollaboratorsProvider,
  CaseOpeningSourceProvider,
} from '@hms/core/case-management/interfaces'
import { CASE_IDENTITY_TRANSACTION } from '@/shared/database/constants/case-identity-transaction'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ZodValidationPipe } from 'nestjs-zod'
import { CasesController } from '@/case-management/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<Parameters<CreateLegalCaseUseCase['execute']>[0], 'actorId'>

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CreateLegalCaseController {
  private readonly createLegalCaseUseCase: CreateLegalCaseUseCase

  constructor(
    @Inject(CASE_IDENTITY_TRANSACTION) transaction: CaseIdentityTransaction,
    @Inject(CASE_MANAGEMENT_PROVIDERS.openingSource)
    openingSourceProvider: CaseOpeningSourceProvider,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaboratorsProvider: CaseCollaboratorsProvider,
    @Inject(DatetimeProvider) datetimeProvider: DatetimeProviderContract,
  ) {
    this.createLegalCaseUseCase = new CreateLegalCaseUseCase(
      transaction,
      openingSourceProvider,
      collaboratorsProvider,
      datetimeProvider,
    )
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo caso jurídico' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Caso criado com sucesso.',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A criação conflita com o estado atual.',
    type: ErrorResponseDto,
  })
  async handle(
    @Body(new ZodValidationPipe(createCaseSchema)) body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<LegalCase> {
    return this.createLegalCaseUseCase.execute({
      ...body,
      actorId: collaborator.collaboratorId,
    })
  }
}
