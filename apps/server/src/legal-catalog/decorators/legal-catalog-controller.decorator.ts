import { applyDecorators, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

export const LegalCatalogController = () =>
  applyDecorators(Controller('legal-catalog'), ApiTags('Legal Catalog'))
