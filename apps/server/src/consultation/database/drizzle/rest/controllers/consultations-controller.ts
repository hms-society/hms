import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common'
import {
  CreateConsultationUseCase,
  RegisterNoShowUseCase,
  StartConsultationUseCase,
  CompleteConsultationUseCase,
} from '@hms/core/consultation/use-cases'
import { ZodValidationPipe } from 'nestjs-zod'

import { CreateConsultationDto } from './dto/create-consultation-dto'

@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly createConsultationUseCase: CreateConsultationUseCase,
    private readonly startConsultationUseCase: StartConsultationUseCase,
    private readonly registerNoShowUseCase: RegisterNoShowUseCase,
    private readonly completeConsultationUseCase: CompleteConsultationUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async create(@Body() dto: CreateConsultationDto) {
    return this.createConsultationUseCase.execute(dto)
  }

  @Patch(':id/start')
  async start(@Param('id') id: string) {
    return this.startConsultationUseCase.execute(id)
  }

  @Patch(':id/no-show')
  async registerNoShow(@Param('id') id: string) {
    return this.registerNoShowUseCase.execute(id)
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    return this.completeConsultationUseCase.execute(id)
  }
}