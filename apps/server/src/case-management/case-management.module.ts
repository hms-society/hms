import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'

@Module({
  imports: [CaseManagementDatabaseModule],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
