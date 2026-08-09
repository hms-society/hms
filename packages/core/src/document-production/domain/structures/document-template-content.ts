type NonEmptyText = string & { readonly __brand: 'NonEmptyText' }
type AbsoluteHttpUrl = string & { readonly __brand: 'AbsoluteHttpUrl' }

type TextMark =
  | { readonly type: 'bold' | 'italic' | 'underline' | 'strike' }
  | {
      readonly type: 'link'
      readonly attrs: {
        readonly href: AbsoluteHttpUrl
        readonly target: null
        readonly rel: null
        readonly class: null
      }
    }

type TextNode = {
  readonly type: 'text'
  readonly text: NonEmptyText
  readonly marks?: readonly TextMark[]
}

type InlineNode = TextNode | { readonly type: 'hardBreak' }

type Paragraph = {
  readonly type: 'paragraph'
  readonly attrs?: { readonly textAlign: 'left' | 'center' | 'right' | null }
  readonly content?: readonly InlineNode[]
}

type Heading = {
  readonly type: 'heading'
  readonly attrs: {
    readonly level: 1 | 2
    readonly textAlign: 'left' | 'center' | 'right' | null
  }
  readonly content?: readonly InlineNode[]
}

type BlockNode = Paragraph | Heading | Blockquote | BulletList | OrderedList

type Blockquote = {
  readonly type: 'blockquote'
  readonly content: readonly [BlockNode, ...BlockNode[]]
}

type ListItem = {
  readonly type: 'listItem'
  readonly content: readonly [Paragraph, ...BlockNode[]]
}

type BulletList = {
  readonly type: 'bulletList'
  readonly content: readonly [ListItem, ...ListItem[]]
}

type OrderedList = {
  readonly type: 'orderedList'
  readonly attrs?: { readonly start?: number; readonly type?: string | null }
  readonly content: readonly [ListItem, ...ListItem[]]
}

export type DocumentTemplateContent = {
  readonly type: 'doc'
  readonly content?: readonly BlockNode[]
}
