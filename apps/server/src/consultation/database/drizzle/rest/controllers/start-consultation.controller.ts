import {
  Controller,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { StartConsultationUseCase } from '@hms/core/consultation/use-cases'
import { CONSULTATIONS_REPOSITORY } from '../../consultation.module'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(AuthGuard)
export class StartConsultationController {
  private readonly useCase: StartConsultationUseCase

  constructor(
    @Inject(CONSULTATIONS_REPOSITORY)
    consultationsRepository: ConsultationsRepository,
  ) {
    this.useCase = new StartConsultationUseCase(consultationsRepository)
  }

  @Patch(':consultationId/start')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A consulta foi iniciada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'O identificador da consulta é inválido.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Autenticação é necessária.',
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
  ) {
    return await this.useCase.execute(consultationId)
  }
}
