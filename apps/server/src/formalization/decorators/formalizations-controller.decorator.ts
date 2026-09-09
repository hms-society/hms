import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const FormalizationsController = () =>
  applyDecorators(Controller('formalizations'), ApiTags('Formalization'))
