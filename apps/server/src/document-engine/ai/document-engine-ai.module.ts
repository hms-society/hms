import { Module } from '@nestjs/common'

import { DOCUMENT_ENGINE_WORKFLOWS } from '@/document-engine/constants/document-engine-workflows'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import {
  ExtractImageTool,
  ExtractPdfTool,
  ExtractUnsupportedFileTool,
  LoadFileTool,
  RecordMetadataTool,
} from '@/document-engine/ai/mastra/tools'
import { ProcessDocumentFileWorkflow } from '@/document-engine/ai/mastra/workflows'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [DocumentsDatabaseModule, ProvisionModule],
  providers: [
    ExtractImageTool,
    ExtractPdfTool,
    ExtractUnsupportedFileTool,
    LoadFileTool,
    ProcessDocumentFileWorkflow,
    RecordMetadataTool,
    {
      provide: DOCUMENT_ENGINE_WORKFLOWS.processDocumentFile,
      useExisting: ProcessDocumentFileWorkflow,
    },
  ],
  exports: [DOCUMENT_ENGINE_WORKFLOWS.processDocumentFile],
})
export class DocumentEngineAiModule {}
