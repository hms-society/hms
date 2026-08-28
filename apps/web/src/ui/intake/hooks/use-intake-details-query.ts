import { useQuery } from '@tanstack/react-query'
import type {
  ClientDetails,
  CollaboratorSummary,
} from '@hms/core/identity/domain/entities'
import type { LegalArea, LegalTopic } from '@hms/core/legal-catalog/domain/entities'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type IntakeDetailsData = {
  intake: Intake
  client?: ClientDetails
  responsible?: CollaboratorSummary
  legalArea?: LegalArea
  legalTopic?: LegalTopic
  previousIntakes: readonly Intake[]
  consultationId?: string
}

export function useIntakeDetailsQuery(intakeId: string) {
  const { identityService, intakeService, legalCatalogService, consultationService } =
    useRestContext()

  return useQuery({
    queryKey: ['intakes', 'detail', intakeId],
    queryFn: async () => {
      const intakeResponse = await intakeService.getIntake(intakeId)

      if (intakeResponse.isFailure) intakeResponse.throwError()

      const intake = intakeResponse.body
      const [client, responsible, legalAreas, allClientIntakes, consultation] =
        await Promise.all([
          getOptionalBody<ClientDetails>(identityService.getClient(intake.clientId)),
          getOptionalBody<CollaboratorSummary>(
            identityService.getCollaborator(intake.responsibleId),
          ),
          getOptionalBody<readonly LegalArea[]>(legalCatalogService.listLegalAreas()),
          getOptionalBody<readonly Intake[]>(
            intakeService.listClientIntake(intake.clientId),
          ),
          getOptionalBody<{ id: string }>(
            consultationService.getConsultationByIntakeId(intake.id),
          ),
        ])

      const previousIntakes =
        allClientIntakes?.filter((previousIntake) => previousIntake.id !== intake.id) ??
        []
      const legalArea = legalAreas?.find((area) => area.id === intake.legalAreaId)
      const topics = legalArea
        ? await getOptionalBody<readonly LegalTopic[]>(
            legalCatalogService.listLegalTopics(legalArea.id),
          )
        : undefined
      const legalTopic = topics?.find((topic) => topic.id === intake.legalTopicId)

      return {
        intake,
        client,
        responsible,
        legalArea,
        legalTopic,
        previousIntakes,
        consultationId: consultation?.id,
      } satisfies IntakeDetailsData
    },
  })
}

async function getOptionalBody<Body>(
  request: Promise<RestResponse<Body>>,
): Promise<Body | undefined> {
  try {
    const response = await request
    if (response.isFailure) return undefined

    return response.body
  } catch {
    return undefined
  }
}
