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
import { UpdateClientQualificationDto } from './dto/update-client-qualification.dto'
import { CompleteConsultationDto } from './dto/complete-consultation-dto'

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
      const consultationId = typeof id === 'object' ? (id as any).id : id
      return await this.startConsultationUseCase.execute(consultationId)
    } catch (error) {
      console.error('ERRO DETALHADO NO START:', error)
      throw error
    }
  }

  @Patch(':id/reschedule')
  async reschedule(@Param('id') id: string) {
    try {
      const consultationId = typeof id === 'object' ? (id as any).id : id
      const consultation = await this.consultationsRepository.findById(consultationId)

      if (!consultation) {
        throw new NotFoundException('Consulta não encontrada.')
      }

      consultation.status = 'pending' as any
      consultation.updatedAt = new Date()

      await this.consultationsRepository.save(consultation)

      return consultation
    } catch (error) {
      console.error('ERRO DETALHADO NO RESCHEDULE:', error)

      if (error instanceof NotFoundException) {
        throw error
      }

      throw new InternalServerErrorException('Erro ao remarcar consulta.')
    }
  }

  @Patch(':id/no-show')
  async registerNoShow(@Param('id') id: string) {
    try {
      const consultationId = typeof id === 'object' ? (id as any).id : id
      return await this.registerNoShowUseCase.execute(consultationId)
    } catch (error) {
      console.error('ERRO DETALHADO NO NO-SHOW:', error)
      throw error
    }
  }

  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    try {
      const consultationId = typeof id === 'object' ? (id as any).id : id

      return await this.completeConsultationUseCase.execute({
        consultationId,
        ...dto,
      })
    } catch (error) {
      console.error('ERRO DETALHADO NO COMPLETE:', error)
      throw error
    }
  }

  @Patch(':id/qualification')
  async updateQualification(
    @Param('id') id: string,
    @Body() dto: UpdateClientQualificationDto,
  ) {
    try {
      const consultationId = typeof id === 'object' ? (id as any).id : id
      const consultation = await this.consultationsRepository.findById(consultationId)

      if (!consultation || !consultation.clientId) {
        throw new NotFoundException('Consulta ou cliente vinculado não encontrado.')
      }

      await this.consultationsRepository.updateClientQualification(
        consultation.clientId,
        dto,
      )

      return { message: 'Qualificação do cliente atualizada com sucesso.' }
    } catch (error) {
      console.error('ERRO DETALHADO NO UPDATE QUALIFICATION:', error)
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Erro ao atualizar qualificação do cliente.')
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      const consultationId = typeof id === 'object' ? (id as any).id : id
      const consultation = await this.getConsultationByIdUseCase.execute(consultationId)

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

  @Patch(':id/reset')
  async resetStatus(@Param('id') id: string) {
    try {
      const consultationId = typeof id === 'object' ? (id as any).id : id
      const consultation = await this.consultationsRepository.findById(consultationId)

      if (!consultation) {
        throw new NotFoundException('Consulta não encontrada.')
      }

      consultation.status = 'pending' as any
      consultation.updatedAt = new Date()

      await this.consultationsRepository.save(consultation)

      return consultation
    } catch (error) {
      console.error('ERRO DETALHADO NO RESET:', error)
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Erro ao redefinir status da consulta.')
    }
  }
}