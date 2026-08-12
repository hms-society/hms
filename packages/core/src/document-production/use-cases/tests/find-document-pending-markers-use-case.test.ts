import { describe, expect, it } from 'vitest'

import type { DocumentTemplateContent } from '../../domain/structures'
import { FindDocumentPendingMarkersUseCase } from '../find-document-pending-markers-use-case'

describe('Find Document Pending Markers Use Case', () => {
  it('finds nested markers once and orders them by name', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Cliente: {client_name}' },
            { type: 'text', text: ', CPF: {client_cpf}' },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Novamente {client_name}' }],
            },
          ],
        },
      ],
    } as unknown as DocumentTemplateContent

    await expect(
      new FindDocumentPendingMarkersUseCase().execute({ content }),
    ).resolves.toEqual([{ marker: '{client_cpf}' }, { marker: '{client_name}' }])
  })

  it('ignores text that does not follow the pending marker format', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '{ClientName} {client-name} {123_client} client_name',
            },
          ],
        },
      ],
    } as unknown as DocumentTemplateContent

    await expect(
      new FindDocumentPendingMarkersUseCase().execute({ content }),
    ).resolves.toEqual([])
  })

  it('returns no markers for an empty document', async () => {
    const content = { type: 'doc' } as DocumentTemplateContent

    await expect(
      new FindDocumentPendingMarkersUseCase().execute({ content }),
    ).resolves.toEqual([])
  })
})
