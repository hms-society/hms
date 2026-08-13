import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { GetConsultationByIdUseCase } from '@hms/core/consultation/use-cases'
import { CONSULTATIONS_REPOSITORY } from '../../consultation.module'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(AuthGuard)
export class GetConsultationByIdController {
  private readonly useCase: GetConsultationByIdUseCase

  constructor(
    @Inject(CONSULTATIONS_REPOSITORY)
    consultationsRepository: ConsultationsRepository,
  ) {
    this.useCase = new GetConsultationByIdUseCase(consultationsRepository)
  }

  @Get(':consultationId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A consulta foi encontrada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'O identificador da consulta é inválido.',
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
    try {
      return await this.useCase.execute(consultationId)
    } catch (error) {
      if (error instanceof Error && error.message === 'Consulta não encontrada.') {
        throw new NotFoundException(error.message)
      }
      throw error
    }
  }
}
