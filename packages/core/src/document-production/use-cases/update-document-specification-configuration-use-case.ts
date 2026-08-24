import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentSpecification } from '../domain/entities'
import {
  DocumentSpecificationNotFoundError,
  InvalidDocumentSpecificationConfigurationError,
  InvalidDocumentTemplateError,
} from '../domain/errors'
import {
  DocumentGenerationMoment,
  SYSTEM_DOCUMENT_TEMPLATE_VARIABLES,
  type DocumentSpecificationApplication,
  type DocumentSpecificationConfigurationUpdate,
  type DocumentTemplateContent,
  type DocumentTemplateVariable,
} from '../domain/structures'
import type { DocumentSpecificationsRepository } from '../interfaces'

type Request = {
  readonly documentSpecificationId: string
  readonly changes: DocumentSpecificationConfigurationUpdate
  readonly userId: string
}

const TECHNICAL_NAME_PATTERN = /^[a-z][a-z0-9_]*$/
const TOKEN_PATTERN = /{{[^{}]*}}/g

export class UpdateDocumentSpecificationConfigurationUseCase
  implements UseCase<Request, DocumentSpecification>
{
  constructor(
    private readonly specificationsRepository: DocumentSpecificationsRepository,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {}

  async execute({
    documentSpecificationId,
    changes,
    userId,
  }: Request): Promise<DocumentSpecification> {
    const current = await this.specificationsRepository.findById(documentSpecificationId)
    if (!current) throw new DocumentSpecificationNotFoundError(documentSpecificationId)

    const application = await this.normalizeApplication(changes.application, false)
    const name = changes.name.trim()
    const description = changes.description.trim()
    const content = changes.content ?? current.content
    const variables = changes.variables ?? current.variables

    if (!name) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'O nome do modelo é obrigatório.',
      )
    }
    if (changes.status !== 'available' && changes.status !== 'unavailable') {
      throw new InvalidDocumentSpecificationConfigurationError(
        'O status do modelo de documento é inválido.',
      )
    }

    if (
      changes.status === 'available' ||
      (this.hasText(content) &&
        (changes.content !== undefined || changes.variables !== undefined))
    ) {
      this.assertValidTemplate(content, variables)
    }

    if (application.scope === 'legal_context') {
      await this.validateCatalog(application)
    }

    const normalizedChanges: DocumentSpecificationConfigurationUpdate = {
      name,
      description,
      status: changes.status,
      accessClassification: changes.accessClassification,
      application,
      ...(changes.content !== undefined ? { content } : {}),
      ...(changes.variables !== undefined ? { variables } : {}),
    }

    const updated = await this.specificationsRepository.replaceConfiguration(
      documentSpecificationId,
      normalizedChanges,
    )

    if (!updated) throw new DocumentSpecificationNotFoundError(documentSpecificationId)

    const oldClassification = (current as any).accessClassification ?? 'Interno'
    const newClassification = normalizedChanges.accessClassification

    if (newClassification && newClassification !== oldClassification) {
      await this.specificationsRepository.registerAuditLog({
        documentSpecificationId,
        userId,
        action: 'CLASSIFICATION_CHANGED',
        previousValue: oldClassification,
        newValue: newClassification,
      })
    }

    return updated
  }

  private async normalizeApplication(
    application: DocumentSpecificationApplication,
    shouldValidateCatalog: boolean,
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
    const legalTopicIdsByArea: Record<string, readonly string[]> = {}
    const applicationAreaIds = Object.keys(application.legalTopicIdsByArea)
    if (
      legalAreaIds.length === 0 ||
      legalAreaIds.some((id) => !id) ||
      areaIds.size !== legalAreaIds.length ||
      applicationAreaIds.length !== legalAreaIds.length ||
      applicationAreaIds.some((id) => !areaIds.has(id))
    ) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'As áreas e associações jurídicas são inválidas.',
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
          'Os temas jurídicos devem ser válidos e únicos.',
        )
      }
      legalTopicIds.forEach((id) => topicIds.add(id))
      legalTopicIdsByArea[legalAreaId] = legalTopicIds
    }

    const selections = legalAreaIds.map((legalAreaId) => ({
      legalAreaId,
      legalTopicIds: legalTopicIdsByArea[legalAreaId],
    }))
    if (
      shouldValidateCatalog &&
      !(await this.legalExpertiseCatalogProvider.validateActive(selections))
    ) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'A aplicação jurídica contém áreas ou temas inativos ou incompatíveis.',
      )
    }

    return {
      scope: 'legal_context',
      moment: application.moment,
      legalAreaIds,
      legalTopicIdsByArea,
    }
  }

  private async validateCatalog(
    application: Extract<DocumentSpecificationApplication, { scope: 'legal_context' }>,
  ): Promise<void> {
    const selections = application.legalAreaIds.map((legalAreaId) => ({
      legalAreaId,
      legalTopicIds: application.legalTopicIdsByArea[legalAreaId],
    }))
    if (!(await this.legalExpertiseCatalogProvider.validateActive(selections))) {
      throw new InvalidDocumentSpecificationConfigurationError(
        'A aplicação jurídica contém áreas ou temas inativos ou incompatíveis.',
      )
    }
  }

  private assertValidTemplate(
    content: DocumentTemplateContent,
    variables: readonly DocumentTemplateVariable[],
  ): void {
    this.assertValidContent(content)
    this.assertValidVariables(variables)
    this.assertValidTokens(content, variables)
    if (!this.hasText(content)) {
      throw new InvalidDocumentTemplateError('O modelo precisa possuir conteúdo textual.')
    }
  }

  private assertValidContent(content: DocumentTemplateContent): void {
    if (!content || typeof content !== 'object' || content.type !== 'doc') {
      throw new InvalidDocumentTemplateError()
    }
    if (content.content !== undefined && !Array.isArray(content.content)) {
      throw new InvalidDocumentTemplateError()
    }
    for (const node of content.content ?? []) this.assertBlock(node)
  }

  private assertBlock(node: unknown): void {
    if (!node || typeof node !== 'object' || !('type' in node)) {
      throw new InvalidDocumentTemplateError()
    }
    const block = node as { type: string; content?: readonly unknown[]; attrs?: unknown }
    if (block.type === 'paragraph') {
      this.assertTextBlock(block, false)
      return
    }
    if (block.type === 'heading') {
      this.assertTextBlock(block, true)
      return
    }
    if (
      block.type === 'blockquote' ||
      block.type === 'bulletList' ||
      block.type === 'orderedList'
    ) {
      if (!Array.isArray(block.content) || block.content.length === 0) {
        throw new InvalidDocumentTemplateError()
      }
      if (block.type === 'orderedList' && block.attrs !== undefined) {
        const attrs = block.attrs as { start?: unknown; type?: unknown }
        if (
          (attrs.start !== undefined &&
            (!Number.isInteger(attrs.start) || (attrs.start as number) < 1)) ||
          (attrs.type !== undefined &&
            attrs.type !== null &&
            typeof attrs.type !== 'string')
        ) {
          throw new InvalidDocumentTemplateError()
        }
      }
      for (const child of block.content) {
        if (block.type === 'blockquote') this.assertBlock(child)
        else this.assertListItem(child)
      }
      return
    }
    throw new InvalidDocumentTemplateError()
  }

  private assertTextBlock(
    block: { type: string; content?: readonly unknown[]; attrs?: unknown },
    isHeading: boolean,
  ): void {
    if (isHeading) {
      const attrs = block.attrs as { level?: unknown; textAlign?: unknown } | undefined
      if (
        !attrs ||
        ![1, 2].includes(attrs.level as number) ||
        !['left', 'center', 'right', null].includes(attrs.textAlign as null | string)
      ) {
        throw new InvalidDocumentTemplateError()
      }
    } else if (block.attrs !== undefined) {
      const attrs = block.attrs as { textAlign?: unknown }
      if (!['left', 'center', 'right', null].includes(attrs.textAlign as null | string)) {
        throw new InvalidDocumentTemplateError()
      }
    }
    if (block.content !== undefined && !Array.isArray(block.content)) {
      throw new InvalidDocumentTemplateError()
    }
    for (const inline of block.content ?? []) this.assertInline(inline)
  }

  private assertInline(inline: unknown): void {
    if (!inline || typeof inline !== 'object' || !('type' in inline)) {
      throw new InvalidDocumentTemplateError()
    }
    const value = inline as { type: string; text?: unknown; marks?: readonly unknown[] }
    if (value.type === 'hardBreak') return
    if (value.type !== 'text' || typeof value.text !== 'string' || !value.text) {
      throw new InvalidDocumentTemplateError()
    }
    for (const mark of value.marks ?? []) {
      if (!mark || typeof mark !== 'object' || !('type' in mark)) {
        throw new InvalidDocumentTemplateError()
      }
      const markValue = mark as { type: string; attrs?: unknown }
      if (['bold', 'italic', 'underline', 'strike'].includes(markValue.type)) continue
      const attrs = markValue.attrs as Record<string, unknown> | undefined
      if (
        markValue.type !== 'link' ||
        !attrs ||
        typeof attrs.href !== 'string' ||
        !/^https?:\/\/[^\s]+$/i.test(attrs.href) ||
        attrs.target !== null ||
        attrs.rel !== null ||
        attrs.class !== null
      ) {
        throw new InvalidDocumentTemplateError()
      }
    }
  }

  private assertListItem(item: unknown): void {
    if (!item || typeof item !== 'object' || !('type' in item)) {
      throw new InvalidDocumentTemplateError()
    }
    const listItem = item as { type: string; content?: readonly unknown[] }
    if (
      listItem.type !== 'listItem' ||
      !Array.isArray(listItem.content) ||
      listItem.content.length === 0
    ) {
      throw new InvalidDocumentTemplateError()
    }
    this.assertTextBlock(
      listItem.content[0] as {
        type: string
        content?: readonly unknown[]
        attrs?: unknown
      },
      false,
    )
    for (const child of listItem.content.slice(1)) this.assertBlock(child)
  }

  private assertValidVariables(variables: readonly DocumentTemplateVariable[]): void {
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
        !TECHNICAL_NAME_PATTERN.test(technicalName) ||
        names.has(technicalName) ||
        (systemTechnicalName !== undefined &&
          (!systemNames.has(systemTechnicalName) ||
            systemSources.has(systemTechnicalName))) ||
        (systemNames.has(technicalName) && systemTechnicalName !== technicalName) ||
        (variable.description !== undefined && !variable.description.trim())
      ) {
        throw new InvalidDocumentTemplateError()
      }
      names.add(technicalName)
      if (systemTechnicalName) systemSources.add(systemTechnicalName)
    }
  }

  private assertValidTokens(
    content: DocumentTemplateContent,
    variables: readonly DocumentTemplateVariable[],
  ): void {
    const knownNames = new Set([
      ...SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.map((variable) => variable.technicalName),
      ...variables.map((variable) => variable.technicalName.trim()),
    ])
    const inspectText = (text: string) => {
      let cursor = 0
      for (const match of text.matchAll(TOKEN_PATTERN)) {
        if (
          text.slice(cursor, match.index).includes('{{') ||
          text.slice(cursor, match.index).includes('}}')
        ) {
          throw new InvalidDocumentTemplateError(
            `Token inválido: ${text.slice(cursor, match.index)}`,
          )
        }
        const technicalName = match[0].slice(2, -2)
        if (
          !TECHNICAL_NAME_PATTERN.test(technicalName) ||
          !knownNames.has(technicalName)
        ) {
          throw new InvalidDocumentTemplateError(`Token desconhecido: ${match[0]}`)
        }
        cursor = (match.index ?? 0) + match[0].length
      }
      if (text.slice(cursor).includes('{{') || text.slice(cursor).includes('}}')) {
        throw new InvalidDocumentTemplateError('O conteúdo possui um token malformado.')
      }
    }
    const inspectNode = (node: unknown): void => {
      if (!node || typeof node !== 'object' || !('type' in node)) return
      const value = node as { type: string; content?: readonly unknown[] }
      if (value.type === 'paragraph' || value.type === 'heading') {
        inspectText(
          (value.content ?? [])
            .map((item) =>
              'text' in (item as object) ? String((item as { text: string }).text) : '',
            )
            .join(''),
        )
      }
      for (const child of value.content ?? []) inspectNode(child)
    }
    for (const node of content.content ?? []) inspectNode(node)
  }

  private hasText(content: DocumentTemplateContent): boolean {
    const text = JSON.stringify(content)
    return typeof text === 'string' && /"text":"[^"\n]*\S[^"\n]*"/.test(text)
  }
}
