import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const IntakesController = () =>
  applyDecorators(Controller('intakes'), ApiTags('Intake'))
