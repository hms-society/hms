import { Module } from '@nestjs/common'

import { CommunicationModule } from '@/communication/communication.module'
import { ConsultationModule } from '@/consultation/consultation.module'
import { DocumentProductionModule } from '@/document-production/document-production.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { IntakeModule } from '@/intake/intake.module'
import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SharedModule } from '@/shared/shared.module'
import { SchedulingModule } from '@/scheduling/database/drizzle/repositories/scheduling.module'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    LegalCatalogModule,
    IntakeModule,
    CommunicationModule,
    ConsultationModule,
    DocumentsModule,
    SchedulingModule,
    DocumentProductionModule,
  ],
})
export class AppModule {}
