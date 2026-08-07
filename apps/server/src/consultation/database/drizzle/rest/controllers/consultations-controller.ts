import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common'
import {
  CreateConsultationUseCase,
  StartConsultationUseCase,
  CompleteConsultationUseCase,
  RegisterNoShowUseCase,
  GetConsultationByIdUseCase,
  CreateConsultationDto,
} from '@hms/core/consultation/use-cases'
import { DrizzleConsultationsRepository } from '../../repository/drizzle-consultations-repository'

export interface RescheduleConsultationDto {
  newDate: string
}

@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly createConsultationUseCase: CreateConsultationUseCase,
    private readonly startConsultationUseCase: StartConsultationUseCase,
    private readonly completeConsultationUseCase: CompleteConsultationUseCase,
    private readonly registerNoShowUseCase: RegisterNoShowUseCase,
    private readonly getConsultationByIdUseCase: GetConsultationByIdUseCase,
    private readonly consultationsRepository: DrizzleConsultationsRepository,
  ) {}

  @Post()
  async create(@Body() dto: CreateConsultationDto) {
    try {
      return await this.createConsultationUseCase.execute(dto)
    } catch (error) {
      console.error('ERRO DETALHADO NO POST:', error)
      throw error
    }
  }

  @Patch(':id/start')
  async start(@Param('id') id: string) {
    try {
      return await this.startConsultationUseCase.execute(id)
    } catch (error) {
      console.error('ERRO DETALHADO NO START:', error)
      throw error
    }
  }

  @Patch(':id/reschedule')
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleConsultationDto,
  ) {
    try {
      const consultation = await this.consultationsRepository.findById(id)

      if (!consultation) {
        throw new NotFoundException('Consulta não encontrada.')
      }

      if (typeof (consultation as any).reschedule === 'function') {
        ;(consultation as any).reschedule(new Date(dto.newDate))
      } else {
        consultation.status = 'rescheduled' as any
        consultation.updatedAt = new Date()
      }

      await this.consultationsRepository.save(consultation)

      return consultation
    } catch (error) {
      console.error('ERRO DETALHADO NO RESCHEDULE:', error)
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Erro ao remarcar consulta.')
    }
  }

  @Patch(':id/no-show')
  async registerNoShow(@Param('id') id: string) {
    try {
      return await this.registerNoShowUseCase.execute(id)
    } catch (error) {
      console.error('ERRO DETALHADO NO NO-SHOW:', error)
      throw error
    }
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    try {
      return await this.completeConsultationUseCase.execute(id)
    } catch (error) {
      console.error('ERRO DETALHADO NO COMPLETE:', error)
      throw error
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      const consultation = await this.getConsultationByIdUseCase.execute(id)

      if (!consultation) {
        throw new NotFoundException('Consulta não encontrada.')
      }

      return consultation
    } catch (error) {
      console.error('ERRO DETALHADO NO GET BY ID:', error)

      if (error instanceof NotFoundException) {
        throw error
      }

      if (error instanceof Error && error.message === 'Consulta não encontrada.') {
        throw new NotFoundException(error.message)
      }

      throw new InternalServerErrorException('Erro ao buscar a consulta.')
    }
  }
}