import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const CollaboratorsController = () =>
  applyDecorators(Controller('collaborators'), ApiTags('Identity'))
