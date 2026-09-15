import { Module } from '@nestjs/common'

import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import { SHARED_PROVIDERS } from '@/shared/constants/shared-providers'
import { SharedModule } from '@/shared/shared.module'

@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: LEGAL_CATALOG_PROVIDERS.dynamicFormUsage,
      useExisting: SHARED_PROVIDERS.dynamicFormUsage,
    },
  ],
  exports: [LEGAL_CATALOG_PROVIDERS.dynamicFormUsage],
})
export class LegalCatalogProvisionModule {}
