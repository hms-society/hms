import { Module } from '@nestjs/common'

import { CaseManagementAccessModule } from '@/case-management/access/case-management-access.module'
import { CaseManagementDatabaseModule } from '@/case-management/database'
import { DOCUMENT_ENGINE_PROVIDERS } from '@/document-engine/constants/document-engine-providers'
import { CaseChecklistUpdateProvider } from './case-checklist-update-provider'

@Module({
  imports: [CaseManagementDatabaseModule, CaseManagementAccessModule],
  providers: [
    CaseChecklistUpdateProvider,
    {
      provide: DOCUMENT_ENGINE_PROVIDERS.caseChecklistUpdate,
      useExisting: CaseChecklistUpdateProvider,
    },
  ],
  exports: [DOCUMENT_ENGINE_PROVIDERS.caseChecklistUpdate],
})
export class DocumentEngineChecklistAccessModule {}
