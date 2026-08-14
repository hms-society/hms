import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetConsultationByIdUseCase } from '@hms/core/consultation/use-cases'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(AuthGuard)
export class GetConsultationByIdController {
  constructor(private readonly useCase: GetConsultationByIdUseCase) {}

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
      const consultation = await this.useCase.execute(consultationId)

      if (!consultation) {
        throw new NotFoundException('A consulta não foi encontrada.')
      }

      return consultation
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }

      if (error instanceof Error && error.message === 'Consulta não encontrada.') {
        throw new NotFoundException(error.message)
      }

      throw error
    }
  }
}
