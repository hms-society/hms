import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const DocumentProductionController = () =>
  applyDecorators(Controller('document-specifications'), ApiTags('Document Production'))
