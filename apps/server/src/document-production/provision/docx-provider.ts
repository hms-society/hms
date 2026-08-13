import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { DocumentFileExporter } from '@hms/core/document-production/interfaces'
import { Injectable } from '@nestjs/common'
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  type ParagraphChild,
  TextRun,
  UnderlineType,
} from 'docx'

type DocumentNode = {
  readonly type: string
  readonly text?: string
  readonly attrs?: {
    readonly level?: number
    readonly textAlign?: 'left' | 'center' | 'right' | null
    readonly href?: string
    readonly start?: number
    readonly type?: string | null
  }
  readonly marks?: readonly {
    readonly type: string
    readonly attrs?: { readonly href?: string }
  }[]
  readonly content?: readonly DocumentNode[]
}

@Injectable()
export class DocxProvider implements DocumentFileExporter {
  async export(input: {
    readonly title: string
    readonly content: DocumentTemplateContent
  }) {
    const document = new Document({
      title: input.title,
      creator: 'HMS',
      numbering: {
        config: [
          {
            reference: 'ordered-list',
            levels: Array.from({ length: 9 }, (_, level) => ({
              level,
              format: LevelFormat.DECIMAL,
              text: `%${level + 1}.`,
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720 + level * 360, hanging: 260 },
                },
              },
            })),
          },
        ],
      },
      sections: [
        {
          properties: {},
          children: this.renderBlocks(input.content.content ?? []),
        },
      ],
    })
    const content = await Packer.toBuffer(document)

    return {
      content: new Uint8Array(content),
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    }
  }

  private renderBlocks(
    nodes: readonly DocumentNode[],
    depth = 0,
    isBlockquote = false,
  ): Paragraph[] {
    return nodes.flatMap((node) => {
      if (node.type === 'blockquote') {
        return this.renderBlocks(node.content ?? [], depth, true)
      }

      if (node.type === 'bulletList' || node.type === 'orderedList') {
        return this.renderList(node, depth)
      }

      return [this.renderParagraph(node, isBlockquote)]
    })
  }

  private renderList(node: DocumentNode, depth: number): Paragraph[] {
    return (node.content ?? []).flatMap((item) =>
      (item.content ?? []).flatMap((child, childIndex) => {
        if (child.type === 'bulletList' || child.type === 'orderedList') {
          return this.renderList(child, depth + 1)
        }

        if (childIndex > 0) return this.renderBlocks([child], depth + 1)

        return [
          new Paragraph({
            children: this.renderInlineNodes(child.content ?? []),
            ...(node.type === 'bulletList'
              ? { bullet: { level: Math.min(depth, 8) } }
              : {
                  numbering: {
                    reference: 'ordered-list',
                    level: Math.min(depth, 8),
                  },
                }),
          }),
        ]
      }),
    )
  }

  private renderParagraph(node: DocumentNode, isBlockquote: boolean): Paragraph {
    return new Paragraph({
      children: this.renderInlineNodes(node.content ?? []),
      ...(node.type === 'heading'
        ? {
            heading:
              node.attrs?.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          }
        : {}),
      ...(node.attrs?.textAlign
        ? { alignment: this.resolveAlignment(node.attrs.textAlign) }
        : {}),
      ...(isBlockquote ? { indent: { left: 720 } } : {}),
    })
  }

  private renderInlineNodes(nodes: readonly DocumentNode[]): ParagraphChild[] {
    const children: ParagraphChild[] = []

    for (const node of nodes) {
      if (node.type === 'hardBreak') {
        children.push(new TextRun({ break: 1 }))
        continue
      }
      if (node.type !== 'text' || !node.text) continue

      const marks = node.marks ?? []
      const textRun = new TextRun({
        text: node.text,
        bold: marks.some((mark) => mark.type === 'bold'),
        italics: marks.some((mark) => mark.type === 'italic'),
        strike: marks.some((mark) => mark.type === 'strike'),
        ...(marks.some((mark) => mark.type === 'underline')
          ? { underline: { type: UnderlineType.SINGLE } }
          : {}),
      })
      const link = marks.find((mark) => mark.type === 'link')?.attrs?.href

      children.push(link ? new ExternalHyperlink({ children: [textRun], link }) : textRun)
    }

    return children
  }

  private resolveAlignment(alignment: 'left' | 'center' | 'right') {
    if (alignment === 'center') return AlignmentType.CENTER
    if (alignment === 'right') return AlignmentType.RIGHT
    return AlignmentType.LEFT
  }
}
