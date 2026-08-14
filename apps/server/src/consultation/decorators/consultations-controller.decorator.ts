import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const ConsultationsController = () =>
  applyDecorators(Controller('consultations'), ApiTags('Consultation'))
