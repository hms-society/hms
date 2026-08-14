import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import type { RestResponse } from '@hms/core/shared/responses/rest-response'

export type ConsultationDocumentActionResult<Body> = {
  readonly body?: Body
  readonly isConflict: boolean
}

export function resolveConsultationDocumentActionResponse<Body>(
  response: RestResponse<Body>,
): ConsultationDocumentActionResult<Body> {
  const isConflict = response.statusCode === HTTP_STATUS_CODE.conflict

  if (!isConflict && response.isFailure) response.throwError()

  return {
    body: isConflict ? undefined : response.body,
    isConflict,
  }
}
