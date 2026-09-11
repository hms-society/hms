import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const CasesController = () =>
  applyDecorators(Controller('cases'), ApiTags('Case Management'))
