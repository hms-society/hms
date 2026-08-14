import type { IntakeService } from '@/rest/services/intake-service'
import type { IdentityService } from '@/rest/services/identity-service'
import type { LegalCatalogService } from '@/rest/services/legal-catalog-service'
import type { CommunicationService } from '@/rest/services/communication-service'
import type { ConsultationService } from '@/rest/services/consultation-service'
import type { documentService } from '@/rest/services/DocumentEngineService'
import type { ConsultationDocumentProductionService } from '@/rest/services/consultation-document-production-service'
import type { DocumentProductionService } from '@/rest/services/document-production-service'

export type RestContextValue = {
  intakeService: ReturnType<typeof IntakeService>
  identityService: ReturnType<typeof IdentityService>
  legalCatalogService: ReturnType<typeof LegalCatalogService>
  communicationService: ReturnType<typeof CommunicationService>
  consultationService: ReturnType<typeof ConsultationService>
  consultationDocumentProductionService: ReturnType<
    typeof ConsultationDocumentProductionService
  >
  documentProductionService: ReturnType<typeof DocumentProductionService>
  schedulingService?: any
  documentService: ReturnType<typeof documentService>
}
