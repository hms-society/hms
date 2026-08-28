import type { CollaboratorSummary } from '../domain/entities'
import {
  CollaboratorNotFoundError,
  InvalidClientDataError,
  InvalidLegalExpertiseError,
} from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser: AuthUser
  readonly collaboratorId: string
  readonly changes: Parameters<CollaboratorsRepository['replace']>[1]
}

const ADMINISTRATIVE_PROFILES = new Set(['admin', 'attendant'])
const LEGAL_PROFILES = new Set(['lawyer', 'paralegal', 'supervisor'])

export class UpdateCollaboratorUseCase implements UseCase<Request, CollaboratorSummary> {
  constructor(
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly authorizeAdminUseCase: UseCase<{ authUser: AuthUser }, void>,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {}

  async execute({
    authUser,
    collaboratorId,
    changes,
  }: Request): Promise<CollaboratorSummary> {
    await this.authorizeAdminUseCase.execute({ authUser })

    const collaborator = await this.collaboratorsRepository.findById(collaboratorId)
    if (!collaborator) throw new CollaboratorNotFoundError()

    const normalizedChanges = await this.normalizeChanges(changes)
    const updatedCollaborator = await this.collaboratorsRepository.replace(
      collaboratorId,
      normalizedChanges,
    )

    if (!updatedCollaborator) throw new CollaboratorNotFoundError()

    const summary = await this.collaboratorsRepository.findSummaryById(collaboratorId)
    if (!summary) throw new CollaboratorNotFoundError()

    return summary
  }

  private async normalizeChanges(
    changes: Request['changes'],
  ): Promise<Request['changes']> {
    const professionalName = changes.professionalName.trim()
    const jobTitle = changes.jobTitle?.trim() || undefined

    if (!professionalName) {
      throw new InvalidClientDataError('Nome profissional é obrigatório.')
    }

    if (
      !ADMINISTRATIVE_PROFILES.has(changes.profile) &&
      !LEGAL_PROFILES.has(changes.profile)
    ) {
      throw new InvalidClientDataError('Perfil de colaborador inválido.')
    }

    const legalExpertises = this.normalizeLegalExpertises(changes)

    if (LEGAL_PROFILES.has(changes.profile)) {
      if (!legalExpertises || legalExpertises.length === 0) {
        throw new InvalidLegalExpertiseError()
      }

      const isActiveCatalog =
        await this.legalExpertiseCatalogProvider.validateActive(legalExpertises)

      if (!isActiveCatalog) throw new InvalidLegalExpertiseError()
    }

    return {
      professionalName,
      ...(jobTitle ? { jobTitle } : {}),
      profile: changes.profile,
      ...(legalExpertises ? { legalExpertises } : {}),
    } as Request['changes']
  }

  private normalizeLegalExpertises(
    changes: Request['changes'],
  ): Request['changes']['legalExpertises'] {
    const hasLegalExpertises = Object.hasOwn(changes, 'legalExpertises')

    if (ADMINISTRATIVE_PROFILES.has(changes.profile)) {
      if (hasLegalExpertises) throw new InvalidLegalExpertiseError()
      return undefined
    }

    if (!Array.isArray(changes.legalExpertises) || changes.legalExpertises.length === 0) {
      return undefined
    }

    const areaIds = new Set<string>()
    const topicIds = new Set<string>()
    const legalExpertises = changes.legalExpertises.map((expertise) => {
      const legalAreaId = expertise.legalAreaId.trim()
      const legalTopicIds = expertise.legalTopicIds.map((legalTopicId) =>
        legalTopicId.trim(),
      )

      if (
        !legalAreaId ||
        legalTopicIds.length === 0 ||
        legalTopicIds.some((legalTopicId) => !legalTopicId) ||
        areaIds.has(legalAreaId) ||
        legalTopicIds.some((legalTopicId) => topicIds.has(legalTopicId)) ||
        new Set(legalTopicIds).size !== legalTopicIds.length
      ) {
        throw new InvalidLegalExpertiseError()
      }

      areaIds.add(legalAreaId)
      legalTopicIds.forEach((legalTopicId) => topicIds.add(legalTopicId))

      return { legalAreaId, legalTopicIds }
    })

    return legalExpertises as unknown as Request['changes']['legalExpertises']
  }
}
