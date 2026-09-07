import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import { DOCUMENT_ENGINE_PROVIDERS } from '@/document-engine/constants/document-engine-providers'
import { CaseChecklistUpdateProvider } from '@/document-engine/provision/case-checklist-update-provider'

@Module({
  imports: [CaseManagementDatabaseModule],
  providers: [
    CaseChecklistUpdateProvider,
    {
      provide: DOCUMENT_ENGINE_PROVIDERS.caseChecklistUpdate,
      useExisting: CaseChecklistUpdateProvider,
    },
  ],
  exports: [DOCUMENT_ENGINE_PROVIDERS.caseChecklistUpdate],
})
export class DocumentEngineProvisionModule {}
