import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DOCUMENT_TEMPLATE_LINK_OPTIONS,
  isAllowedDocumentTemplateHref,
  parseDocumentTemplateContent,
} from '../document-editor'
import {
  isDocumentSpecificationNotFoundError,
  shouldBlockLegalConfigurationSubmit,
} from '../use-document-specification-page'
import { VariablePicker } from '../variable-picker'

describe('Document specification page widgets', () => {
  afterEach(cleanup)

  it('filters system and local variables by accessible metadata', async () => {
    render(
      <VariablePicker
        variables={[
          {
            label: 'Número do processo',
            technicalName: 'numero_processo',
            description: 'Identificador do processo.',
          },
        ]}
        onInsert={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    expect(screen.getByText('Nome do cliente')).toBeTruthy()
    const search = screen.getByRole('textbox', { name: 'Buscar variáveis' })
    fireEvent.change(search, { target: { value: 'PROCESSO' } })

    expect(screen.getByText('Número do processo')).toBeTruthy()
    expect(screen.queryByText('Nome do cliente')).toBeNull()
  })

  it('shows an empty state when no variable matches', () => {
    render(<VariablePicker variables={[]} onInsert={vi.fn()} onAdd={vi.fn()} />)
    const search = screen.getByRole('textbox', { name: 'Buscar variáveis' })
    fireEvent.change(search, { target: { value: 'inexistente' } })
    expect(screen.getByText('Nenhuma variável encontrada.')).toBeTruthy()
  })

  it('creates a local variable through the controlled dialog', () => {
    const onAdd = vi.fn()
    render(<VariablePicker variables={[]} onInsert={vi.fn()} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole('button', { name: 'Criar variável personalizada' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Rótulo' }), {
      target: { value: 'Número do processo' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição' }), {
      target: { value: 'Identificador.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar variável' }))

    expect(onAdd).toHaveBeenCalledWith({
      label: 'Número do processo',
      technicalName: 'numero_do_processo',
      description: 'Identificador.',
    })
  })

  it('keeps the dialog open with a field error for reserved or duplicate names', () => {
    render(
      <VariablePicker
        variables={[{ label: 'Processo', technicalName: 'processo' }]}
        onInsert={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Criar variável personalizada' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Rótulo' }), {
      target: { value: 'Processo' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome técnico' }), {
      target: { value: 'processo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar variável' }))

    expect(screen.getByText('Esse nome técnico já foi usado neste modelo.')).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('accepts only HTTP(S) template links with neutral link attributes', () => {
    expect(isAllowedDocumentTemplateHref('https://example.com/path')).toBe(true)
    expect(isAllowedDocumentTemplateHref('http://example.com')).toBe(true)
    expect(isAllowedDocumentTemplateHref('javascript:alert(1)')).toBe(false)
    expect(isAllowedDocumentTemplateHref('/relative-path')).toBe(false)
    expect(DOCUMENT_TEMPLATE_LINK_OPTIONS.HTMLAttributes).toEqual({
      target: null,
      rel: null,
      class: null,
    })
  })

  it('round-trips contract links through the shared safeParse boundary', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [
            {
              type: 'text',
              text: 'site',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://example.com',
                    target: null,
                    rel: null,
                    class: null,
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    expect(parseDocumentTemplateContent(content).success).toBe(true)
    expect(
      parseDocumentTemplateContent({
        ...content,
        content: [
          {
            ...content.content[0],
            content: [
              {
                ...content.content[0].content[0],
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'https://example.com',
                      target: null,
                      rel: null,
                      class: null,
                      title: null,
                    },
                  },
                ],
              },
            ],
          },
        ],
      }).success,
    ).toBe(false)
  })

  it('distinguishes a not-found response from a transient detail error', () => {
    const notFound = Object.assign(new Error('not found'), { statusCode: 404 })
    const transient = Object.assign(new Error('timeout'), { statusCode: 503 })

    expect(isDocumentSpecificationNotFoundError(notFound)).toBe(true)
    expect(isDocumentSpecificationNotFoundError(transient)).toBe(false)
    expect(isDocumentSpecificationNotFoundError(new Error('unknown'))).toBe(false)
  })

  it('blocks legal configuration submit while catalog data is unavailable', () => {
    expect(shouldBlockLegalConfigurationSubmit('legal_context', true, false)).toBe(true)
    expect(shouldBlockLegalConfigurationSubmit('legal_context', false, true)).toBe(true)
    expect(shouldBlockLegalConfigurationSubmit('global', true, true)).toBe(false)
  })
})
