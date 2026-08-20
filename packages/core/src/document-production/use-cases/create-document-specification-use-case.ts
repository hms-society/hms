import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

import type {
  DocumentSpecification,
  DocumentSpecificationCreation,
} from '../domain/entities'
import {
  InvalidDocumentSpecificationConfigurationError,
  InvalidDocumentTemplateError,
} from '../domain/errors'
import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
  SYSTEM_DOCUMENT_TEMPLATE_VARIABLES,
  type CreateDocumentSpecificationInput,
  type DocumentSpecificationApplication,
  type DocumentTemplateContent,
  type DocumentTemplateVariable,
} from '../domain/structures'
import type { DocumentSpecificationsRepository } from '../interfaces'

type Request = CreateDocumentSpecificationInput

const EMPTY_TEMPLATE: DocumentTemplateContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export class CreateDocumentSpecificationUseCase
  implements UseCase<Request, DocumentSpecification>
{
  constructor(
    private readonly specificationsRepository: DocumentSpecificationsRepository,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {}

  async execute(request: Request): Promise<DocumentSpecification> {
    const application = await this.normalizeApplication(request.application)
    const name = request.name.trim()
    const description = request.description.trim()
    const content = request.content ?? EMPTY_TEMPLATE
    const variables = request.variables ?? []
    const status = request.status ?? DocumentSpecificationStatus.Available

    if (!name) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'O nome do modelo é obrigatório.',
      )
    }

    if (status === DocumentSpecificationStatus.Available || this.getText(content).trim())
      this.assertValidTemplate(content, variables)

    const creation: DocumentSpecificationCreation = {
      name,
      description,
      application,
      content,
      variables,
      status,
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

  private assertValidTemplate(
    content: DocumentTemplateContent,
    variables: readonly DocumentTemplateVariable[],
  ): void {
    const text = this.getText(content).trim()
    if (!text) throw new InvalidDocumentTemplateError('O template não pode ser vazio.')

    const names = new Set<string>()
    const systemNames = new Set(
      SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.map((variable) => variable.technicalName),
    )
    const systemSources = new Set<string>()
    for (const variable of variables) {
      const technicalName = variable.technicalName.trim()
      const systemTechnicalName = variable.systemTechnicalName?.trim()
      if (
        !variable.label.trim() ||
        !/^[a-z][a-z0-9_]*$/.test(technicalName) ||
        (variable.description !== undefined && !variable.description.trim()) ||
        (systemTechnicalName !== undefined &&
          (!systemNames.has(systemTechnicalName) ||
            systemSources.has(systemTechnicalName))) ||
        (systemNames.has(technicalName) && systemTechnicalName !== technicalName)
      )
        throw new InvalidDocumentTemplateError()
      if (names.has(technicalName)) throw new InvalidDocumentTemplateError()
      names.add(technicalName)
      if (systemTechnicalName) systemSources.add(systemTechnicalName)
    }

    const knownNames = new Set([
      ...systemNames,
      ...variables.map((variable) => variable.technicalName.trim()),
    ])
    for (const token of text.match(/{{[^{}]*}}/g) ?? []) {
      const technicalName = token.slice(2, -2)
      if (!/^[a-z][a-z0-9_]*$/.test(technicalName) || !knownNames.has(technicalName))
        throw new InvalidDocumentTemplateError(`Token desconhecido: ${token}`)
    }
    if (text.includes('{{') || text.includes('}}')) {
      let remainder = text
      for (const token of text.match(/{{[^{}]*}}/g) ?? [])
        remainder = remainder.replace(token, '')
      if (remainder.includes('{{') || remainder.includes('}}'))
        throw new InvalidDocumentTemplateError('O conteúdo possui um token malformado.')
    }
  }

  private getText(value: unknown): string {
    if (!value || typeof value !== 'object') return ''
    const node = value as { text?: unknown; content?: unknown }
    const ownText = typeof node.text === 'string' ? node.text : ''
    const childText = Array.isArray(node.content)
      ? node.content.map((child) => this.getText(child)).join(' ')
      : ''
    return `${ownText} ${childText}`.trim()
  }
}
