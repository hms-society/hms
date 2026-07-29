import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const ClientsController = () =>
  applyDecorators(Controller('clients'), ApiTags('Identity'))
