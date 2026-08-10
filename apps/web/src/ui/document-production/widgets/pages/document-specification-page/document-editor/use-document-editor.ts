import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import {
  documentTemplateContentSchema,
  isAllowedAbsoluteHttpUrl,
} from '@hms/validation/document-production'
import { useEditor } from '@tiptap/react'
import Link from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useEffect, useRef } from 'react'

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

export function useDocumentEditor({
  content,
  onChange,
  onEditorReady,
  onFocus,
}: DocumentEditorProps) {
  const lastEmittedContent = useRef<string | null>(null)
  const editor = useEditor({
    immediatelyRender: false,
    content: content as never,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      ContractLink.configure({
        ...DOCUMENT_TEMPLATE_LINK_OPTIONS,
        validate: isAllowedDocumentTemplateHref,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    editorProps: {
      handleDOMEvents: {
        dragover: (_view, event) => {
          const dragEvent = event as DragEvent
          const dataTransfer = dragEvent.dataTransfer
          if (!dataTransfer?.types.includes('application/x-hms-template-variable'))
            return false
          dragEvent.preventDefault()
          dataTransfer.dropEffect = 'copy'
          return true
        },
      },
      handleDrop: (view, event) => {
        const dragEvent = event as DragEvent
        const dataTransfer = dragEvent.dataTransfer
        const technicalName = dataTransfer?.getData('application/x-hms-template-variable')
        if (!technicalName || !/^[a-z][a-z0-9_]*$/.test(technicalName)) return false

        const coordinates = view.posAtCoords({
          left: dragEvent.clientX,
          top: dragEvent.clientY,
        })
        if (!coordinates) return false

        view.dispatch(view.state.tr.insertText(`{{${technicalName}}}`, coordinates.pos))
        dragEvent.preventDefault()
        return true
      },
    },
    onUpdate: ({ editor: instance }) => {
      const parsed = parseDocumentTemplateContent(instance.getJSON())
      if (parsed.success) {
        const nextContent = parsed.data as DocumentTemplateContent
        lastEmittedContent.current = JSON.stringify(nextContent)
        onChange(nextContent)
      }
    },
    onFocus,
  })

  useEffect(
    function syncEditorContent() {
      if (!editor) return
      const nextContentJson = JSON.stringify(content)
      if (lastEmittedContent.current === nextContentJson) {
        lastEmittedContent.current = null
        return
      }
      if (JSON.stringify(editor.getJSON()) !== nextContentJson)
        editor.commands.setContent(content as never, { emitUpdate: false })
    },
    [content, editor],
  )

  function applyLink() {
    if (!editor) return
    const href = window.prompt('Informe a URL HTTP(S) do link:', 'https://')?.trim()
    if (!href) return
    try {
      if (!isAllowedDocumentTemplateHref(href)) return
    } catch {
      return
    }
    editor.chain().focus().setLink({ href }).run()
  }

  function setParagraph() {
    editor?.chain().focus().setParagraph().run()
  }

  function toggleHeading(level: 1 | 2) {
    editor?.chain().focus().toggleHeading({ level }).run()
  }

  function toggleBold() {
    editor?.chain().focus().toggleBold().run()
  }

  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run()
  }

  function toggleUnderline() {
    editor?.chain().focus().toggleUnderline().run()
  }

  function toggleBulletList() {
    editor?.chain().focus().toggleBulletList().run()
  }

  function toggleBlockquote() {
    editor?.chain().focus().toggleBlockquote().run()
  }

  function toggleOrderedList() {
    editor?.chain().focus().toggleOrderedList().run()
  }

  function toggleStrike() {
    editor?.chain().focus().toggleStrike().run()
  }

  function setTextAlign(alignment: 'left' | 'center' | 'right') {
    editor?.chain().focus().setTextAlign(alignment).run()
  }

  function clearFormatting() {
    editor?.chain().focus().clearNodes().unsetAllMarks().run()
  }

  function undo() {
    editor?.chain().focus().undo().run()
  }

  function redo() {
    editor?.chain().focus().redo().run()
  }

  function focusEditor() {
    editor?.commands.focus()
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

  return {
    active: {
      bold: editor?.isActive('bold') ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      blockquote: editor?.isActive('blockquote') ?? false,
      heading1: editor?.isActive('heading', { level: 1 }) ?? false,
      heading2: editor?.isActive('heading', { level: 2 }) ?? false,
      italic: editor?.isActive('italic') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
      strike: editor?.isActive('strike') ?? false,
      underline: editor?.isActive('underline') ?? false,
      alignLeft: editor?.isActive({ textAlign: 'left' }) ?? false,
      alignCenter: editor?.isActive({ textAlign: 'center' }) ?? false,
      alignRight: editor?.isActive({ textAlign: 'right' }) ?? false,
    },
    applyLink,
    canRedo: editor?.can().redo() ?? false,
    canUndo: editor?.can().undo() ?? false,
    clearFormatting,
    editor,
    focusEditor,
    isEmpty: editor?.isEmpty ?? true,
    redo,
    setParagraph,
    setTextAlign,
    toggleBlockquote,
    toggleBold,
    toggleBulletList,
    toggleHeading,
    toggleItalic,
    toggleOrderedList,
    toggleStrike,
    toggleUnderline,
    undo,
  }
}
