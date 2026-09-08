import { Module } from '@nestjs/common'

import { DOCUMENT_ENGINE_WORKFLOWS } from '@/document-engine/constants/document-engine-workflows'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import {
  CreateSuggestionTool,
  ExtractImageTool,
  ExtractPdfTool,
  ExtractUnsupportedFileTool,
  LoadFileTool,
  RecordMetadataTool,
} from '@/document-engine/ai/mastra/tools'
import {
  DocumentImageAnalyzerAgent,
  DocumentSuggestionAgent,
} from '@/document-engine/ai/mastra/agents'
import {
  ProcessDocumentFileWorkflow,
  SuggestDocumentFileWorkflow,
} from '@/document-engine/ai/mastra/workflows'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [DocumentsDatabaseModule, ProvisionModule],
  providers: [
    DocumentImageAnalyzerAgent,
    DocumentSuggestionAgent,
    CreateSuggestionTool,
    ExtractImageTool,
    ExtractPdfTool,
    ExtractUnsupportedFileTool,
    LoadFileTool,
    ProcessDocumentFileWorkflow,
    SuggestDocumentFileWorkflow,
    RecordMetadataTool,
    {
      provide: DOCUMENT_ENGINE_WORKFLOWS.processDocumentFile,
      useExisting: ProcessDocumentFileWorkflow,
    },
    {
      provide: DOCUMENT_ENGINE_WORKFLOWS.suggestDocumentFile,
      useExisting: SuggestDocumentFileWorkflow,
    },
  ],
  exports: [
    DOCUMENT_ENGINE_WORKFLOWS.processDocumentFile,
    DOCUMENT_ENGINE_WORKFLOWS.suggestDocumentFile,
  ],
})
export class DocumentEngineAiModule {}
