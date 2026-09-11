import type { LegalCaseSummary } from '../domain/structures'
import type { RestResponse } from '../../shared/responses/rest-response'

export interface CaseManagementService {
  getByIntakeId(intakeId: string): Promise<RestResponse<LegalCaseSummary | null>>
}
