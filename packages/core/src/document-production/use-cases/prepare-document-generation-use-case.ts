import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentGeneration } from '../domain/entities'
import { DocumentSpecificationNotFoundError } from '../domain/errors'
import {
  DocumentGenerationStatus,
  type DocumentGenerationSource,
  type DocumentTemplateContent,
} from '../domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentSpecificationsRepository,
} from '../interfaces'

type Request = {
  documentGenerationId: string
  documentId: string
  documentSpecificationVersionId: string
  requestedByCollaboratorId: string
  source: DocumentGenerationSource
}

export class PrepareDocumentGenerationUseCase
  implements UseCase<Request, DocumentGeneration>
{
  constructor(
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly specificationsRepository: DocumentSpecificationsRepository,
  ) {}

  async execute(request: Request): Promise<DocumentGeneration> {
    const specification = await this.specificationsRepository.findById(
      request.documentSpecificationVersionId,
    )

    if (!specification) {
      throw new DocumentSpecificationNotFoundError(request.documentSpecificationVersionId)
    }

    const templateVariableValues = this.getTemplateVariableValues(request.source.data)
    const baseDocumentContent = request.source.data.baseDocumentContent
    const templateContent =
      typeof baseDocumentContent === 'object' &&
      baseDocumentContent !== null &&
      !Array.isArray(baseDocumentContent) &&
      'type' in baseDocumentContent &&
      baseDocumentContent.type === 'doc'
        ? (baseDocumentContent as DocumentTemplateContent)
        : specification.content

    return this.generationsRepository.addOrGet({
      id: request.documentGenerationId,
      documentId: request.documentId,
      documentSpecificationVersionId: request.documentSpecificationVersionId,
      requestedByCollaboratorId: request.requestedByCollaboratorId,
      source: request.source,
      template: {
        name: specification.name,
        content: this.fillTemplateVariables(templateContent, templateVariableValues),
        variables: specification.variables,
      },
      status: DocumentGenerationStatus.Pending,
      attemptsCount: 0,
      findings: [],
    })
  }

  private getTemplateVariableValues(
    sourceData: Readonly<Record<string, unknown>>,
  ): Readonly<Record<string, string>> {
    const value = sourceData.templateVariableValues
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}

    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === 'string' && entry[1].trim().length > 0,
      ),
    )
  }

  private fillTemplateVariables<T>(
    value: T,
    variables: Readonly<Record<string, string>>,
  ): T {
    if (typeof value === 'string') {
      return value.replace(/\{\{([a-z][a-z0-9_]*)\}\}/g, (token, name: string) => {
        return variables[name] ?? token
      }) as T
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.fillTemplateVariables(item, variables)) as T
    }

    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          this.fillTemplateVariables(item, variables),
        ]),
      ) as T
    }

    return value
  }
}
