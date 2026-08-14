import { applyDecorators, Controller, UseGuards } from '@nestjs/common'

import { AuthGuard } from '@/identity/guards'

export const DocumentValidationController = () =>
  applyDecorators(Controller('document-validation'), UseGuards(AuthGuard))
