import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentSpecification } from '../domain/entities'
import {
  DocumentSpecificationNotFoundError,
  InvalidDocumentTemplateError,
} from '../domain/errors'
import {
  SYSTEM_DOCUMENT_TEMPLATE_VARIABLES,
  type DocumentSpecificationTemplateUpdate,
  type DocumentTemplateContent,
  type DocumentTemplateVariable,
} from '../domain/structures'
import type { DocumentSpecificationsRepository } from '../interfaces'

type Request = {
  readonly documentSpecificationId: string
  readonly changes: DocumentSpecificationTemplateUpdate
}

const TECHNICAL_NAME_PATTERN = /^[a-z][a-z0-9_]*$/
const TOKEN_PATTERN = /{{[^{}]*}}/g

export class UpdateDocumentSpecificationTemplateUseCase
  implements UseCase<Request, DocumentSpecification>
{
  constructor(
    private readonly specificationsRepository: DocumentSpecificationsRepository,
  ) {}

  async execute({
    documentSpecificationId,
    changes,
  }: Request): Promise<DocumentSpecification> {
    const current = await this.specificationsRepository.findById(documentSpecificationId)
    if (!current) throw new DocumentSpecificationNotFoundError(documentSpecificationId)

    this.assertValidContent(changes.content)
    this.assertValidVariables(changes.variables)
    this.assertValidTokens(changes.content, changes.variables)

    const updated = await this.specificationsRepository.replaceTemplate(
      documentSpecificationId,
      {
        content: changes.content,
        variables: changes.variables.map((variable) => ({
          label: variable.label.trim(),
          technicalName: variable.technicalName.trim(),
          ...(variable.description?.trim()
            ? { description: variable.description.trim() }
            : {}),
        })),
      },
    )
    if (!updated) throw new DocumentSpecificationNotFoundError(documentSpecificationId)
    return updated
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
    if (!node || typeof node !== 'object' || !('type' in node))
      throw new InvalidDocumentTemplateError()
    const block = node as { type: string; content?: readonly unknown[]; attrs?: unknown }
    if (block.type === 'paragraph' || block.type === 'heading') {
      if (block.type === 'heading') {
        const attrs = block.attrs as { level?: unknown; textAlign?: unknown } | undefined
        if (
          !attrs ||
          ![1, 2].includes(attrs.level as number) ||
          !['left', null].includes(attrs.textAlign as null | string)
        )
          throw new InvalidDocumentTemplateError()
      } else if (
        block.attrs !== undefined &&
        !['left', null].includes(
          (block.attrs as { textAlign?: unknown }).textAlign as null | string,
        )
      ) {
        throw new InvalidDocumentTemplateError()
      }
      if (block.content !== undefined && !Array.isArray(block.content))
        throw new InvalidDocumentTemplateError()
      for (const inline of block.content ?? []) this.assertInline(inline)
      return
    }
    if (block.type === 'blockquote' || block.type === 'bulletList') {
      if (!Array.isArray(block.content) || block.content.length === 0)
        throw new InvalidDocumentTemplateError()
      for (const child of block.content)
        block.type === 'bulletList' ? this.assertListItem(child) : this.assertBlock(child)
      return
    }
    throw new InvalidDocumentTemplateError()
  }

  private assertInline(inline: unknown): void {
    if (!inline || typeof inline !== 'object' || !('type' in inline))
      throw new InvalidDocumentTemplateError()
    const value = inline as { type: string; text?: unknown; marks?: readonly unknown[] }
    if (value.type === 'hardBreak') return
    if (value.type !== 'text' || typeof value.text !== 'string' || !value.text)
      throw new InvalidDocumentTemplateError()
    for (const mark of value.marks ?? []) {
      if (!mark || typeof mark !== 'object' || !('type' in mark))
        throw new InvalidDocumentTemplateError()
      const markValue = mark as { type: string; attrs?: unknown }
      if (['bold', 'italic', 'underline'].includes(markValue.type)) continue
      const attrs = markValue.attrs as Record<string, unknown> | undefined
      if (
        markValue.type !== 'link' ||
        !attrs ||
        typeof attrs.href !== 'string' ||
        !/^https?:\/\/[^\s]+$/i.test(attrs.href) ||
        attrs.target !== null ||
        attrs.rel !== null ||
        attrs.class !== null
      )
        throw new InvalidDocumentTemplateError()
    }
  }

  private assertListItem(item: unknown): void {
    if (!item || typeof item !== 'object' || !('type' in item))
      throw new InvalidDocumentTemplateError()
    const listItem = item as { type: string; content?: readonly unknown[] }
    if (
      listItem.type !== 'listItem' ||
      !Array.isArray(listItem.content) ||
      listItem.content.length === 0
    )
      throw new InvalidDocumentTemplateError()
    this.assertBlock(listItem.content[0])
    if ((listItem.content[0] as { type: string }).type !== 'paragraph')
      throw new InvalidDocumentTemplateError()
    for (const child of listItem.content.slice(1)) this.assertBlock(child)
  }

  private assertValidVariables(variables: readonly DocumentTemplateVariable[]): void {
    const names = new Set<string>()
    const systemNames = new Set(
      SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.map((variable) => variable.technicalName),
    )
    for (const variable of variables) {
      const technicalName = variable.technicalName.trim()
      if (
        !variable.label.trim() ||
        !TECHNICAL_NAME_PATTERN.test(technicalName) ||
        names.has(technicalName) ||
        systemNames.has(technicalName) ||
        (variable.description !== undefined && !variable.description.trim())
      )
        throw new InvalidDocumentTemplateError()
      names.add(technicalName)
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
        )
          throw new InvalidDocumentTemplateError('O conteúdo possui um token malformado.')
        const technicalName = match[0].slice(2, -2)
        if (!TECHNICAL_NAME_PATTERN.test(technicalName) || !knownNames.has(technicalName))
          throw new InvalidDocumentTemplateError(`Token desconhecido: ${match[0]}`)
        cursor = (match.index ?? 0) + match[0].length
      }
      if (text.slice(cursor).includes('{{') || text.slice(cursor).includes('}}'))
        throw new InvalidDocumentTemplateError('O conteúdo possui um token malformado.')
    }
    const inspectNode = (node: unknown): void => {
      if (!node || typeof node !== 'object' || !('type' in node)) return
      const value = node as { type: string; content?: readonly unknown[] }
      if (value.type === 'paragraph' || value.type === 'heading')
        inspectText(
          (value.content ?? [])
            .map((item) =>
              'text' in (item as object) ? String((item as { text: string }).text) : '',
            )
            .join(''),
        )
      for (const child of value.content ?? []) inspectNode(child)
    }
    for (const node of content.content ?? []) inspectNode(node)
  }
}
