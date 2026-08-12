import { Module } from '@nestjs/common'
import { FindDocumentPendingMarkersUseCase } from '@hms/core/document-production/use-cases'

import {
  DocumentReviewerAgent,
  DocumentWriterAgent,
} from '@/document-production/ai/mastra/agents'
import {
  CompleteDocumentGenerationTool,
  FailDocumentGenerationTool,
  LoadDocumentGenerationTool,
  PrepareDocumentGenerationTool,
  ResolveDocumentGenerationOutcomeTool,
  ReviewDocumentCycleTool,
  SaveGeneratedDocumentVersionTool,
  StartDocumentGenerationTool,
} from '@/document-production/ai/mastra/tools'
import { GenerateDocumentWorkflow } from '@/document-production/ai/mastra/workflows'
import { DOCUMENT_PRODUCTION_WORKFLOWS } from '@/document-production/constants/document-production-workflows'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [
    DocumentProductionDatabaseModule,
    DocumentProductionProvisionModule,
    ProvisionModule,
  ],
  providers: [
    CompleteDocumentGenerationTool,
    DocumentReviewerAgent,
    DocumentWriterAgent,
    FailDocumentGenerationTool,
    FindDocumentPendingMarkersUseCase,
    GenerateDocumentWorkflow,
    {
      provide: DOCUMENT_PRODUCTION_WORKFLOWS.generateDocument,
      useExisting: GenerateDocumentWorkflow,
    },
    LoadDocumentGenerationTool,
    PrepareDocumentGenerationTool,
    ResolveDocumentGenerationOutcomeTool,
    ReviewDocumentCycleTool,
    SaveGeneratedDocumentVersionTool,
    StartDocumentGenerationTool,
  ],
  exports: [DOCUMENT_PRODUCTION_WORKFLOWS.generateDocument],
})
export class DocumentProductionAiModule {}
