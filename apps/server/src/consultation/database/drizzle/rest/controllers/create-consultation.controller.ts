import { Body, Controller, HttpStatus, Inject, Post, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { CreateConsultationUseCase } from '@hms/core/consultation/use-cases'
import { createConsultationSchema } from '@hms/validation/consultation'
import { ZodValidationPipe } from 'nestjs-zod'
import { CONSULTATIONS_REPOSITORY } from '../../consultation.module'
import { CreateConsultationDto } from './dto/create-consultation-dto'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(AuthGuard)
export class CreateConsultationController {
  private readonly useCase: CreateConsultationUseCase

  constructor(
    @Inject(CONSULTATIONS_REPOSITORY)
    consultationsRepository: ConsultationsRepository,
  ) {
    this.useCase = new CreateConsultationUseCase(consultationsRepository)
  }

  @Post()
  @ApiBody({ type: CreateConsultationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'A consulta foi criada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Os dados da consulta são inválidos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Autenticação é necessária.',
    type: ErrorResponseDto,
  })
  @UsePipes(new ZodValidationPipe(createConsultationSchema))
  async handle(@Body() body: CreateConsultationDto) {
    return await this.useCase.execute(body)
  }
}