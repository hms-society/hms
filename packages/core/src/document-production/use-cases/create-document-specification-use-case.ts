import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

import type {
  DocumentSpecification,
  DocumentSpecificationCreation,
} from '../domain/entities'
import { InvalidDocumentSpecificationConfigurationError } from '../domain/errors'
import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
  type CreateDocumentSpecificationInput,
  type DocumentSpecificationApplication,
  type DocumentTemplateContent,
} from '../domain/structures'
import type { DocumentSpecificationMutationRepository } from '../interfaces'

type Request = CreateDocumentSpecificationInput

const EMPTY_TEMPLATE: DocumentTemplateContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export class CreateDocumentSpecificationUseCase
  implements UseCase<Request, DocumentSpecification>
{
  constructor(
    private readonly specificationsRepository: DocumentSpecificationMutationRepository,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {}

  async execute(request: Request): Promise<DocumentSpecification> {
    const application = await this.normalizeApplication(request.application)
    const name = request.name.trim()
    const description = request.description.trim()

    if (!name) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'O nome do modelo é obrigatório.',
      )
    }

    const creation: DocumentSpecificationCreation = {
      name,
      description,
      application,
      isRequired: request.isRequired,
      content: EMPTY_TEMPLATE,
      variables: [],
      status: DocumentSpecificationStatus.Unavailable,
    }

    return this.specificationsRepository.add(creation)
  }

  private async normalizeApplication(
    application: DocumentSpecificationApplication,
  ): Promise<DocumentSpecificationApplication> {
    if (!application || typeof application !== 'object') {
      throw new InvalidDocumentSpecificationConfigurationError(
        'A aplicação do modelo de documento é inválida.',
      )
    }

    if (!Object.values(DocumentGenerationMoment).includes(application.moment)) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'O momento de geração do modelo de documento é inválido.',
      )
    }

    if (application.scope === 'global') {
      return {
        scope: 'global',
        moment: application.moment,
      }
    }

    if (application.scope !== 'legal_context') {
      throw new InvalidDocumentSpecificationConfigurationError(
        'O escopo da aplicação é inválido.',
      )
    }

    const legalAreaIds = application.legalAreaIds.map((id) => id.trim())
    const areaIds = new Set(legalAreaIds)
    const topicIds = new Set<string>()
    const topicIdsByArea: Record<string, readonly string[]> = {}

    if (
      legalAreaIds.length === 0 ||
      legalAreaIds.some((id) => !id) ||
      areaIds.size !== legalAreaIds.length
    ) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'A aplicação jurídica deve possuir áreas válidas e únicas.',
      )
    }

    const applicationAreaIds = Object.keys(application.legalTopicIdsByArea)
    if (
      applicationAreaIds.length !== legalAreaIds.length ||
      applicationAreaIds.some((id) => !areaIds.has(id))
    ) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'As associações jurídicas não correspondem às áreas selecionadas.',
      )
    }

    for (const legalAreaId of legalAreaIds) {
      const legalTopicIds = application.legalTopicIdsByArea[legalAreaId]?.map((id) =>
        id.trim(),
      )
      if (
        !legalTopicIds ||
        legalTopicIds.length === 0 ||
        legalTopicIds.some((id) => !id) ||
        new Set(legalTopicIds).size !== legalTopicIds.length ||
        legalTopicIds.some((id) => topicIds.has(id))
      ) {
        throw new InvalidDocumentSpecificationConfigurationError(
          'A aplicação jurídica deve possuir temas válidos e únicos.',
        )
      }

      legalTopicIds.forEach((id) => topicIds.add(id))
      topicIdsByArea[legalAreaId] = legalTopicIds
    }

    const selections = legalAreaIds.map((legalAreaId) => ({
      legalAreaId,
      legalTopicIds: topicIdsByArea[legalAreaId],
    }))
    const isActive = await this.legalExpertiseCatalogProvider.validateActive(selections)

    if (!isActive) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'A aplicação jurídica contém áreas ou temas inativos ou incompatíveis.',
      )
    }

    return {
      scope: 'legal_context',
      moment: application.moment,
      legalAreaIds,
      legalTopicIdsByArea: topicIdsByArea,
    }
  }
}
