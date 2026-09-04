import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const SigningGatewayController = () =>
  applyDecorators(
    Controller('formalizations/signing-gateway'),
    ApiTags('Signing Gateway'),
  )
