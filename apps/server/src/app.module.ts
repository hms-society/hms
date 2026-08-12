import { Module } from '@nestjs/common'

import { CommunicationModule } from '@/communication/communication.module'
import { ProcessWhatsappEventJob } from '@/communication/messaging/inngest/jobs'
import { ConsultationModule } from '@/consultation/consultation.module'
import { CreateConsultationFromAppointmentJob } from '@/consultation/messaging/inngest/jobs'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { ProcessWhatsappBatchJob } from '@/document-engine/messaging/inngest/jobs'
import { DocumentProductionModule } from '@/document-production/document-production.module'
import {
  GenerateDocumentJob,
  GenerateDocumentsInBatchJob,
} from '@/document-production/messaging/inngest/jobs'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeModule } from '@/intake/intake.module'
import {
  CompleteIntakeConsultationSchedulingJob,
  FailIntakeConsultationSchedulingJob,
} from '@/intake/messaging/inngest/jobs'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'
import { SchedulingModule } from '@/scheduling/database/drizzle/repositories/scheduling.module'
import { ReserveIntakeAppointmentJob } from '@/scheduling/messaging/inngest/jobs'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import type { InngestOptions } from '@/shared/messaging/inngest/inngest-options'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { SharedModule } from '@/shared/shared.module'

@Module({
  imports: [
    SharedModule,
    IdentityModule,
    LegalCatalogModule,
    IntakeModule,
    CommunicationModule,
    DocumentsModule,
    ConsultationModule,
    SchedulingModule,
    DocumentProductionModule,
    InngestModule.forRootAsync({
      imports: [
        SharedMessagingModule,
        CommunicationModule,
        DocumentsModule,
        ConsultationModule,
        IntakeModule,
        SchedulingModule,
        DocumentProductionModule,
      ],
      inject: [
        InngestClient,
        ProcessWhatsappEventJob,
        ProcessWhatsappBatchJob,
        ReserveIntakeAppointmentJob,
        CreateConsultationFromAppointmentJob,
        CompleteIntakeConsultationSchedulingJob,
        FailIntakeConsultationSchedulingJob,
        GenerateDocumentJob,
        GenerateDocumentsInBatchJob,
      ],
      useFactory: (
        client: InngestClient,
        processWhatsappEventJob: ProcessWhatsappEventJob,
        processWhatsappBatchJob: ProcessWhatsappBatchJob,
        reserveIntakeAppointmentJob: ReserveIntakeAppointmentJob,
        createConsultationFromAppointmentJob: CreateConsultationFromAppointmentJob,
        completeIntakeConsultationSchedulingJob: CompleteIntakeConsultationSchedulingJob,
        failIntakeConsultationSchedulingJob: FailIntakeConsultationSchedulingJob,
        generateDocumentJob: GenerateDocumentJob,
        generateDocumentsInBatchJob: GenerateDocumentsInBatchJob,
      ): InngestOptions => ({
        client,
        functions: [
          processWhatsappEventJob.function,
          processWhatsappBatchJob.function,
          reserveIntakeAppointmentJob.function,
          createConsultationFromAppointmentJob.function,
          completeIntakeConsultationSchedulingJob.function,
          failIntakeConsultationSchedulingJob.function,
          generateDocumentJob.function,
          generateDocumentsInBatchJob.function,
        ],
      }),
    }),
  ],
})
export class AppModule {}
