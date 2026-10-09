import type { LegalCaseSummary, LegalCaseTeamMemberSummary } from '../domain/entities'
import type { LegalCase } from '../domain/entities'
import type { CaseCollaboratorsProvider, CaseMembersRepository } from '../interfaces'
import type { ClientsRepository } from '#identity/interfaces/clients-repository'
import type { LegalAreasRepository } from '../../legal-catalog/interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '../../legal-catalog/interfaces/legal-topics-repository'
import { NotFoundError } from '#shared/domain/errors/not-found-error'

type ProjectionDependencies = {
  clientsRepository: ClientsRepository
  legalAreasRepository: LegalAreasRepository
  legalTopicsRepository: LegalTopicsRepository
  caseMembersRepository: CaseMembersRepository
  collaboratorsProvider: CaseCollaboratorsProvider
}

export async function projectLegalCaseSummary(
  legalCase: LegalCase,
  dependencies: ProjectionDependencies,
): Promise<LegalCaseSummary> {
  const [summary] = await projectLegalCaseSummaries([legalCase], dependencies)
  if (!summary) throw new Error('Legal case summary projection returned no result.')
  return summary
}

export async function projectLegalCaseSummaries(
  legalCases: readonly LegalCase[],
  dependencies: ProjectionDependencies,
): Promise<readonly LegalCaseSummary[]> {
  if (legalCases.length === 0) return []

  const [clients, areas, topics, memberships] = await Promise.all([
    dependencies.clientsRepository.findByIds(
      unique(legalCases.map(({ clientId }) => clientId)),
    ),
    dependencies.legalAreasRepository.findByIds(
      unique(legalCases.map(({ legalAreaId }) => legalAreaId)),
    ),
    dependencies.legalTopicsRepository.findByIds(
      unique(legalCases.map(({ legalTopicId }) => legalTopicId)),
    ),
    dependencies.caseMembersRepository.listByCaseIds(
      unique(legalCases.map(({ id }) => id)),
    ),
  ])

  const clientsById = new Map(clients.map((client) => [client.id, client]))
  const areasById = new Map(areas.map((area) => [area.id, area]))
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]))
  const activeMemberships = memberships.filter(
    (membership) => !membership.removedAt && !membership.archivedLegacy,
  )
  const collaboratorIds = unique(
    activeMemberships.map(({ collaboratorId }) => collaboratorId),
  )
  const collaborators = collaboratorIds.length
    ? await dependencies.collaboratorsProvider.findByIds(collaboratorIds)
    : []
  const collaboratorsById = new Map(
    collaborators.map((collaborator) => [collaborator.collaboratorId, collaborator]),
  )
  const membershipsByCaseId = new Map<string, (typeof activeMemberships)[number][]>()
  for (const membership of activeMemberships) {
    const current = membershipsByCaseId.get(membership.caseId) ?? []
    current.push(membership)
    membershipsByCaseId.set(membership.caseId, current)
  }

  return legalCases.map((legalCase) => {
    const client = clientsById.get(legalCase.clientId)
    const area = areasById.get(legalCase.legalAreaId)
    const topic = topicsById.get(legalCase.legalTopicId)
    if (!client || !area || !topic) {
      throw new NotFoundError('Os dados de apresentação do Caso não foram encontrados.')
    }

    const team: LegalCaseTeamMemberSummary[] = []
    for (const membership of membershipsByCaseId.get(legalCase.id) ?? []) {
      const collaborator = collaboratorsById.get(membership.collaboratorId)
      if (!collaborator) continue
      team.push({
        collaboratorId: collaborator.collaboratorId,
        name: collaborator.professionalName,
        role: membership.role,
      })
    }

    return {
      id: legalCase.id,
      intakeId: legalCase.intakeId,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      status: legalCase.status,
      teamVersion: legalCase.teamVersion ?? 0,
      clientName: getClientName(client),
      legalArea: area.name,
      legalTopic: topic.name,
      openedAt: legalCase.openedAt,
      updatedAt: legalCase.updatedAt,
      checklistGate: legalCase.checklistGate,
      dossierGate: legalCase.dossierGate,
      team,
    }
  })
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function getClientName(
  client: NonNullable<Awaited<ReturnType<ClientsRepository['findById']>>>,
): string {
  if (client.type === 'natural') return client.name
  return client.tradeName || client.legalName
}
