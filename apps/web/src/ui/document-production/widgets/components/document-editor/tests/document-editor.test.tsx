import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'

import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

import { DocumentEditor, parseDocumentTemplateContent } from '..'

const EMPTY_CONTENT = {
  type: 'doc',
  content: [{ type: 'paragraph', attrs: { textAlign: null } }],
} as DocumentTemplateContent

function renderDocumentEditor(
  content: DocumentTemplateContent = EMPTY_CONTENT,
  props: Omit<
    Partial<ComponentProps<typeof DocumentEditor>>,
    'onChange' | 'onEditorReady'
  > = {},
) {
  const onChange = vi.fn()
  const onEditorReady = vi.fn()
  render(
    <DocumentEditor
      content={content}
      onChange={onChange}
      onEditorReady={onEditorReady}
      {...props}
    />,
  )
  return { onChange, onEditorReady }
}

async function waitForEditor() {
  await waitFor(() =>
    expect(
      screen.getByRole('toolbar', { name: 'Formatação do template' }),
    ).not.toBeNull(),
  )
  return screen.getByRole('textbox')
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  Range.prototype.getClientRects = () =>
    ({ length: 0, item: () => null }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
})

describe('DocumentEditor', () => {
  it('shows an actionable empty template state', async () => {
    renderDocumentEditor()
    const editor = await waitForEditor()

    expect(screen.queryByRole('button', { name: 'Inserir link' })).toBeNull()
    expect(screen.getByText('Ainda não há conteúdo no template')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Começar a escrever' }))

    expect(editor).not.toBeNull()
  })

  it('applies toolbar block formats and exposes their active state', async () => {
    renderDocumentEditor()
    const editor = await waitForEditor()

    fireEvent.click(screen.getByRole('button', { name: 'Título 1' }))
    await waitFor(() => expect(editor.querySelector('h1')).not.toBeNull())

    cleanup()
    renderDocumentEditor()
    const listEditor = await waitForEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Lista numerada' }))
    await waitFor(() => expect(listEditor.querySelector('ol')).not.toBeNull())

    cleanup()
    renderDocumentEditor()
    const quoteEditor = await waitForEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Citação' }))
    await waitFor(() => expect(quoteEditor.querySelector('blockquote')).not.toBeNull())
  })

  it('emits a variable token through the editor-ready insertion callback', async () => {
    const { onChange, onEditorReady } = renderDocumentEditor()
    await waitForEditor()
    await waitFor(() => expect(onEditorReady).toHaveBeenCalledOnce())

    const insertVariable = onEditorReady.mock.calls[0][0]
    insertVariable('cliente_nome')

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(JSON.stringify(onChange.mock.lastCall?.[0])).toContain('{{cliente_nome}}')
  })

  it('keeps read-only content inaccessible to editing controls', async () => {
    renderDocumentEditor(
      {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texto' }] }],
      } as unknown as DocumentTemplateContent,
      { editable: false, ariaLabel: 'Visualização do documento' },
    )

    await waitFor(() => expect(screen.getByRole('textbox')).not.toBeNull())
    expect(screen.queryByRole('toolbar')).toBeNull()
    expect(screen.getByRole('textbox').getAttribute('aria-label')).toBe(
      'Visualização do documento',
    )
    expect(screen.getByRole('textbox').getAttribute('contenteditable')).toBe('false')
  })

  it('highlights and focuses the first matching pending marker without changing JSON', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [{ type: 'text', text: 'Preencha {{cliente_nome}}.' }],
        },
      ],
    } as unknown as DocumentTemplateContent
    const { onChange } = renderDocumentEditor(content, {
      highlightedTerms: ['{{cliente_nome}}'],
    })
    const editor = await waitForEditor()

    await waitFor(() =>
      expect(editor.querySelector('[data-pending-marker="true"]')).not.toBeNull(),
    )
    expect(parseDocumentTemplateContent(content).success).toBe(true)
    expect(onChange.mock.lastCall?.[0]).toEqual(content)
  })
})
