import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import {
  documentTemplateContentSchema,
  isAllowedAbsoluteHttpUrl,
} from '@hms/validation/document-production'
import { useEditor, EditorContent } from '@tiptap/react'
import Link from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useState } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DocumentEditorProps = {
  content: DocumentTemplateContent
  onChange: (content: DocumentTemplateContent) => void
  onEditorReady?: (insert: (name: string) => void) => void
  onFocus?: () => void
}

export const DOCUMENT_TEMPLATE_LINK_OPTIONS = {
  autolink: false,
  linkOnPaste: false,
  openOnClick: false,
  protocols: ['http', 'https'],
  HTMLAttributes: { target: null, rel: null, class: null },
}

export function isAllowedDocumentTemplateHref(href: string) {
  return isAllowedAbsoluteHttpUrl(href)
}

export function parseDocumentTemplateContent(value: unknown) {
  return documentTemplateContentSchema.safeParse(value)
}

const ContractLink = Link.extend({
  addAttributes() {
    const attributes = (this.parent?.() ?? {}) as Record<string, unknown>
    const { title: _title, ...contractAttributes } = attributes
    return contractAttributes
  },
})

export const DocumentEditor = ({
  content,
  onChange,
  onEditorReady,
  onFocus,
}: DocumentEditorProps) => {
  const [link, setLink] = useState('')
  const editor = useEditor({
    immediatelyRender: false,
    content: content as never,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        orderedList: false,
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      ContractLink.configure({
        ...DOCUMENT_TEMPLATE_LINK_OPTIONS,
        validate: isAllowedDocumentTemplateHref,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left'] }),
    ],
    onUpdate: ({ editor: instance }) => {
      const parsed = parseDocumentTemplateContent(instance.getJSON())
      if (parsed.success) onChange(parsed.data as DocumentTemplateContent)
    },
    onFocus,
  })

  useEffect(
    function syncEditorContent() {
      if (!editor) return
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content))
        editor.commands.setContent(content as never, { emitUpdate: false })
    },
    [content, editor],
  )

  function applyLink() {
    if (!editor || !link) return
    try {
      if (!isAllowedDocumentTemplateHref(link)) return
    } catch {
      return
    }
    editor.chain().focus().setLink({ href: link }).run()
    setLink('')
  }

  useEffect(
    function exposeVariableInsertion() {
      if (editor && onEditorReady)
        onEditorReady(function insertVariable(name: string) {
          editor.chain().focus().insertContent(`{{${name}}}`).run()
        })
    },
    [editor, onEditorReady],
  )
  if (!editor)
    return <div aria-busy='true' className='min-h-72 rounded-lg border bg-muted/20' />
  return (
    <div className='overflow-hidden rounded-lg border bg-card'>
      <div
        className='flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2'
        role='toolbar'
        aria-label='Formatação do template'
      >
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Título 1'
          aria-pressed={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Título 2'
          aria-pressed={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Negrito'
          aria-pressed={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Itálico'
          aria-pressed={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Sublinhado'
          aria-pressed={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Lista'
          aria-pressed={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Citação'
          aria-pressed={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “ ”
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Desfazer'
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </Button>
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          aria-label='Refazer'
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </Button>
        <div className='ml-auto flex items-center gap-1'>
          <Label htmlFor='template-link' className='sr-only'>
            Link HTTP(S)
          </Label>
          <Input
            id='template-link'
            className='h-8 w-44'
            placeholder='https://...'
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
          <Button type='button' size='sm' variant='outline' onClick={applyLink}>
            Link
          </Button>
        </div>
      </div>
      <EditorContent
        editor={editor}
        aria-label='Conteúdo do template'
        className='relative min-h-72 p-5 [&_.ProseMirror]:min-h-64 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-2 [&_.ProseMirror_h1]:font-serif [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-xl'
      />
      {editor.isEmpty && (
        <div className='pointer-events-none absolute inset-x-0 bottom-0 top-[53px] flex flex-col items-center justify-center gap-3 bg-card/95 p-6 text-center'>
          <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-highlight text-highlight-foreground'>
            <Icon name='file-text' className='h-5 w-5' />
          </span>
          <div>
            <p className='font-medium text-foreground'>Ainda não há conteúdo</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Escreva o conteúdo do template para começar.
            </p>
          </div>
          <Button
            type='button'
            size='sm'
            className='pointer-events-auto'
            onClick={() => editor.commands.focus()}
          >
            Começar a escrever
          </Button>
        </div>
      )}
    </div>
  )
}
