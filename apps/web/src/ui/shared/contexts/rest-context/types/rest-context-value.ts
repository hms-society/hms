import type { IntakeService } from '@/rest/services/intake-service'
import type { IdentityService } from '@/rest/services/identity-service'
import type { LegalCatalogService } from '@/rest/services/legal-catalog-service'
import type { SchedulingService } from '@/rest/services/scheduling-service'

export type RestContextValue = {
  intakeService: ReturnType<typeof IntakeService>
  identityService: ReturnType<typeof IdentityService>
  legalCatalogService: ReturnType<typeof LegalCatalogService>
  schedulingService: ReturnType<typeof SchedulingService>
}
