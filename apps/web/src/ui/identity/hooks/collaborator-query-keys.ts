import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'

const COLLABORATOR_QUERY_SCOPE = 'identity'

export const collaboratorQueryKeys = {
  all: [COLLABORATOR_QUERY_SCOPE, 'collaborators'] as const,
  current: [COLLABORATOR_QUERY_SCOPE, 'collaborator', 'current'] as const,
  detail: (collaboratorId: string) =>
    [COLLABORATOR_QUERY_SCOPE, 'collaborator', collaboratorId] as const,
  list: (query: CollaboratorListQuery) =>
    [
      COLLABORATOR_QUERY_SCOPE,
      'collaborators',
      'list',
      {
        search: query.search ?? '',
        profile: query.profile ?? null,
        jobTitle: query.jobTitle ?? '',
        status: query.status ?? null,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      },
    ] as const,
  jobTitles: [COLLABORATOR_QUERY_SCOPE, 'collaborators', 'job-titles'] as const,
  legalAreas: [COLLABORATOR_QUERY_SCOPE, 'legal-catalog', 'areas'] as const,
  legalTopics: (legalAreaId: string | undefined) =>
    [COLLABORATOR_QUERY_SCOPE, 'legal-catalog', 'topics', legalAreaId ?? null] as const,
}
