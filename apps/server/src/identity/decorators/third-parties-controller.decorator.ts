import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const ThirdPartiesController = () =>
  applyDecorators(Controller('third-parties'), ApiTags('Identity'))
