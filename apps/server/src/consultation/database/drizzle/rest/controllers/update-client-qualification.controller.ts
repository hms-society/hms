import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { updateClientQualificationSchema } from '@hms/validation/consultation'
import { ZodValidationPipe } from 'nestjs-zod'
import { CONSULTATIONS_REPOSITORY } from '../../consultation.module'
import { DrizzleConsultationsRepository } from '../../repository/drizzle-consultations-repository'
import { UpdateClientQualificationDto } from './dto/update-client-qualification.dto'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(AuthGuard)
export class UpdateClientQualificationController {
  constructor(
    @Inject(CONSULTATIONS_REPOSITORY)
    private readonly consultationsRepository: DrizzleConsultationsRepository,
  ) {}

  @Patch(':consultationId/qualification')
  @ApiBody({ type: UpdateClientQualificationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Qualificação do cliente atualizada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Os dados informados para qualificação são inválidos.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consulta ou cliente vinculado não encontrado.',
    type: ErrorResponseDto,
  })
  async handle(
    @Param('consultationId', new ParseUUIDPipe())
    consultationId: string,
    @Body(new ZodValidationPipe(updateClientQualificationSchema))
    body: UpdateClientQualificationDto,
  ) {
    const consultation = await this.consultationsRepository.findById(consultationId)

    if (!consultation?.clientId) {
      throw new NotFoundException('Consulta ou cliente vinculado não encontrado.')
    }

    await this.consultationsRepository.updateClientQualification(
      consultation.clientId,
      body,
    )

    return { message: 'Qualificação do cliente atualizada com sucesso.' }
  }
}
