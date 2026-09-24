import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const CommunicationsController = () =>
  applyDecorators(Controller('communications'), ApiTags('Communication'))
