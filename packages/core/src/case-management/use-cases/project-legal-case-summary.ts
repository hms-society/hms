import type { LegalCaseSummary, LegalCaseTeamMemberSummary } from '../domain/entities'
import type { LegalCase } from '../domain/entities'
import type { CaseCollaboratorsProvider, CaseTeamMembersRepository } from '../interfaces'
import type { ClientsRepository } from '#identity/interfaces/clients-repository'
import type { LegalAreasRepository } from '../../legal-catalog/interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '../../legal-catalog/interfaces/legal-topics-repository'

export async function projectLegalCaseSummary(
  legalCase: LegalCase,
  dependencies: {
    clientsRepository: ClientsRepository
    legalAreasRepository: LegalAreasRepository
    legalTopicsRepository: LegalTopicsRepository
    caseMembersRepository: CaseTeamMembersRepository
    collaboratorsProvider: CaseCollaboratorsProvider
  },
): Promise<LegalCaseSummary> {
  const [client, area, topic, memberships] = await Promise.all([
    dependencies.clientsRepository.findById(legalCase.clientId),
    dependencies.legalAreasRepository.findById(legalCase.legalAreaId),
    dependencies.legalTopicsRepository.findById(legalCase.legalTopicId),
    dependencies.caseMembersRepository.listByCaseId(legalCase.id),
  ])
  if (!client || !area || !topic) {
    throw new Error('Os dados de apresentação do Caso não foram encontrados.')
  }

  const team = await projectTeam(memberships, dependencies)
  const clientName = getClientName(client)

  return {
    id: legalCase.id,
    intakeId: legalCase.intakeId,
    publicCode: legalCase.publicCode,
    title: legalCase.title,
    status: legalCase.status,
    teamVersion: legalCase.teamVersion ?? 0,
    clientName,
    legalArea: area.name,
    legalTopic: topic.name,
    openedAt: legalCase.openedAt,
    updatedAt: legalCase.updatedAt,
    checklistGate: legalCase.checklistGate,
    dossierGate: legalCase.dossierGate,
    team,
  }
}

async function projectTeam(
  memberships: Awaited<ReturnType<CaseTeamMembersRepository['listByCaseId']>>,
  dependencies: { collaboratorsProvider: CaseCollaboratorsProvider },
): Promise<LegalCaseTeamMemberSummary[]> {
  const active = memberships.filter(
    (membership) => !membership.removedAt && !membership.archivedLegacy,
  )
  const team = await Promise.all(
    active.map(async (membership) => {
      const collaborator = await dependencies.collaboratorsProvider.findById(
        membership.collaboratorId,
      )
      if (!collaborator) return undefined
      return {
        collaboratorId: collaborator.collaboratorId,
        name: collaborator.professionalName,
        role: membership.role,
      } satisfies LegalCaseTeamMemberSummary
    }),
  )
  return team.filter(
    (member): member is LegalCaseTeamMemberSummary => member !== undefined,
  )
}

function getClientName(
  client: NonNullable<Awaited<ReturnType<ClientsRepository['findById']>>>,
): string {
  if (client.type === 'natural') return client.name
  return client.tradeName || client.legalName
}
