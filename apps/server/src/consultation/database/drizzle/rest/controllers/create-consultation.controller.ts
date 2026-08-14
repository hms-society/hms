import { Body, Controller, HttpStatus, Post, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateConsultationUseCase } from '@hms/core/consultation/use-cases'
import { createConsultationSchema } from '@hms/validation/consultation'
import { ZodValidationPipe } from 'nestjs-zod'

import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

import { CreateConsultationDto } from './dto/create-consultation-dto'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(AuthGuard)
export class CreateConsultationController {
  constructor(private readonly useCase: CreateConsultationUseCase) {}

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
