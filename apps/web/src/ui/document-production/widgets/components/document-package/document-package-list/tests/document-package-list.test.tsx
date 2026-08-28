import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DocumentPackageList } from '..'

describe('DocumentPackageList', () => {
  afterEach(cleanup)

  it('renders one row for each package item', () => {
    render(
      <DocumentPackageList
        items={[
          {
            id: 'document-1',
            title: 'Procuração',
            status: 'approved',
            statusLabel: 'Aprovado',
            isCurrent: true,
            isGenerating: false,
            isTimedOut: false,
          },
          {
            id: 'document-2',
            title: 'Contrato',
            status: 'not_generated',
            statusLabel: 'Não gerado',
            isCurrent: false,
            isGenerating: false,
            isTimedOut: false,
          },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Procuração' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Contrato' })).toBeDefined()
  })
})
