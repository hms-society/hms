import { Body, Controller, HttpStatus, Inject, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { CompleteConsultationUseCase } from '@hms/core/consultation/use-cases'
import { completeConsultationSchema } from '@hms/validation/consultation'
import { ZodValidationPipe } from 'nestjs-zod'
import { CONSULTATIONS_REPOSITORY } from '../../consultation.module'
import { CompleteConsultationDto } from './dto/complete-consultation-dto'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(AuthGuard)
export class CompleteConsultationController {
  private readonly useCase: CompleteConsultationUseCase

  constructor(
    @Inject(CONSULTATIONS_REPOSITORY)
    consultationsRepository: ConsultationsRepository,
  ) {
    this.useCase = new CompleteConsultationUseCase(consultationsRepository)
  }

  @Patch(':consultationId/complete')
  @ApiBody({ type: CompleteConsultationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A consulta foi finalizada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Os dados informados para finalização são inválidos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'A consulta não foi encontrada.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('consultationId', new ParseUUIDPipe())
    consultationId: string,
    @Body(new ZodValidationPipe(completeConsultationSchema))
    body: CompleteConsultationDto,
  ) {
    return await this.useCase.execute({
      consultationId,
      ...body,
    })
  }
}