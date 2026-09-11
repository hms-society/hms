import { Module } from '@nestjs/common'

import { DOCUMENT_ENGINE_WORKFLOWS } from '@/document-engine/constants/document-engine-workflows'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import {
  ClassifyDocumentFileTool,
  DetectDocumentDuplicateTool,
  ExtractImageTool,
  ExtractPdfTool,
  ExtractUnsupportedFileTool,
  ListDocumentReferenceCandidatesTool,
  LoadFileTool,
  RecordMetadataTool,
} from '@/document-engine/ai/mastra/tools'
import {
  DocumentImageAnalyzerAgent,
  DocumentJsonOrganizerAgent,
} from '@/document-engine/ai/mastra/agents'
import { ProcessDocumentFileWorkflow } from '@/document-engine/ai/mastra/workflows'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [DocumentsDatabaseModule, ProvisionModule],
  providers: [
    DocumentImageAnalyzerAgent,
    DocumentJsonOrganizerAgent,
    ClassifyDocumentFileTool,
    DetectDocumentDuplicateTool,
    ExtractImageTool,
    ExtractPdfTool,
    ExtractUnsupportedFileTool,
    ListDocumentReferenceCandidatesTool,
    LoadFileTool,
    ProcessDocumentFileWorkflow,
    RecordMetadataTool,
    {
      provide: DOCUMENT_ENGINE_WORKFLOWS.processDocumentFile,
      useExisting: ProcessDocumentFileWorkflow,
    },
  ],
  exports: [DOCUMENT_ENGINE_WORKFLOWS.processDocumentFile, DocumentJsonOrganizerAgent],
})
export class DocumentEngineAiModule {}
