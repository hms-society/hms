import { Module } from '@nestjs/common'

import { CaseManagementModule } from '@/case-management/case-management.module'

import { CommunicationModule } from '@/communication/communication.module'
import { COMMUNICATION_INNGEST_FUNCTIONS } from '@/communication/messaging/communication-messaging.module'
import { ConsultationModule } from '@/consultation/consultation.module'
import { CONSULTATION_INNGEST_FUNCTIONS } from '@/consultation/messaging/consultation-messaging.module'
import { DocumentProductionModule } from '@/document-production/document-production.module'
import { DOCUMENT_PRODUCTION_INNGEST_FUNCTIONS } from '@/document-production/messaging/document-production-messaging.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { DOCUMENT_ENGINE_INNGEST_FUNCTIONS } from '@/document-engine/messaging/document-engine-messaging.module'
import { IntakeModule } from '@/intake/intake.module'
import { INTAKE_INNGEST_FUNCTIONS } from '@/intake/messaging/intake-messaging.module'
import { IdentityModule } from '@/identity/identity.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SharedModule } from '@/shared/shared.module'
import { SchedulingModule } from '@/scheduling/database/drizzle/repositories/scheduling.module'
import { SCHEDULING_INNGEST_FUNCTIONS } from '@/scheduling/messaging/scheduling-messaging.module'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import type {
  InngestFunctionGroup,
  InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    LegalCatalogModule,
    IntakeModule,
    CaseManagementModule,
    CommunicationModule,
    ConsultationModule,
    DocumentsModule,
    SchedulingModule,
    DocumentProductionModule,
    InngestModule.forRootAsync({
      imports: [
        SharedMessagingModule,
        CaseManagementModule,
        CommunicationModule,
        DocumentsModule,
        IntakeModule,
        ConsultationModule,
        SchedulingModule,
        DocumentProductionModule,
      ],
      inject: [
        InngestClient,
        COMMUNICATION_INNGEST_FUNCTIONS,
        DOCUMENT_ENGINE_INNGEST_FUNCTIONS,
        INTAKE_INNGEST_FUNCTIONS,
        CONSULTATION_INNGEST_FUNCTIONS,
        SCHEDULING_INNGEST_FUNCTIONS,
        DOCUMENT_PRODUCTION_INNGEST_FUNCTIONS,
      ],
      useFactory: (
        client: InngestClient,
        communicationFunctions: InngestFunctionGroup,
        documentEngineFunctions: InngestFunctionGroup,
        intakeFunctions: InngestFunctionGroup,
        consultationFunctions: InngestFunctionGroup,
        schedulingFunctions: InngestFunctionGroup,
        documentProductionFunctions: InngestFunctionGroup,
      ): InngestOptions => ({
        client,
        functions: [
          ...communicationFunctions,
          ...documentEngineFunctions,
          ...intakeFunctions,
          ...consultationFunctions,
          ...schedulingFunctions,
          ...documentProductionFunctions,
        ],
      }),
    }),
  ],
})
export class AppModule {}
