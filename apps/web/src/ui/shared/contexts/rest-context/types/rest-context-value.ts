import type { IntakeService } from '@/rest/services/intake-service'
import type { IdentityService } from '@/rest/services/identity-service'
import type { LegalCatalogService } from '@/rest/services/legal-catalog-service'
import type { CommunicationService } from '@/rest/services/communication-service'
import type { ConsultationService } from '@/rest/services/consultation-service'
import type { CaseManagementService } from '@/rest/services/case-management-service'
import type { DocumentEngineService } from '@/rest/services/document-engine-service'
import type { ConsultationDocumentProductionService } from '@/rest/services/consultation-document-production-service'
import type { DocumentProductionService } from '@/rest/services/document-production-service'
import type { AiSuggestionsService } from '@/rest/services/AiSuggestionsService'
import type { DocumentValidationService } from '@/rest/services/document-validation-service'
import type { SchedulingService } from '@/rest/services/scheduling-service'
import type { DynamicFormService } from '@/rest/services/dynamic-form-service'

export type RestContextValue = {
  intakeService: ReturnType<typeof IntakeService>
  identityService: ReturnType<typeof IdentityService>
  legalCatalogService: ReturnType<typeof LegalCatalogService>
  communicationService: ReturnType<typeof CommunicationService>
  caseManagementService: ReturnType<typeof CaseManagementService>
  consultationService: ReturnType<typeof ConsultationService>
  consultationDocumentProductionService: ReturnType<
    typeof ConsultationDocumentProductionService
  >
  documentProductionService: ReturnType<typeof DocumentProductionService>
  schedulingService: ReturnType<typeof SchedulingService>
  documentService: ReturnType<typeof DocumentEngineService>
  documentValidationService: ReturnType<typeof DocumentValidationService>
  aiSuggestionsService: ReturnType<typeof AiSuggestionsService>
  dynamicFormService: ReturnType<typeof DynamicFormService>
}
