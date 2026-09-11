import type { CaseManagementService as CaseManagementRestService } from '@hms/core/case-management/interfaces'
import type { LegalCaseSummary } from '@hms/core/case-management/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

export const CaseManagementService = (
  restClient: RestClient,
): CaseManagementRestService => ({
  async getByIntakeId(intakeId) {
    const response = await restClient.get<LegalCaseSummary | null>(
      `/cases/by-intake/${intakeId}`,
    )
    if (response.isFailure || response.body === null) return response
    const body = response.body

    return new RestResponse({
      body: { ...body, openedAt: new Date(body.openedAt) },
      statusCode: response.statusCode,
      headers: response.headers,
    })
  },
})
