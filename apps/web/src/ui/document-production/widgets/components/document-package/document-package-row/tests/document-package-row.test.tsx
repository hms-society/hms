import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DocumentPackageRow } from '..'

const item = {
  id: 'document-1',
  title: 'Procuração',
  latestVersion: { id: 'version-1', versionNumber: 1, status: 'approved' as const },
  status: 'approved' as const,
  statusLabel: 'Aprovado',
  isCurrent: true,
  isGenerating: false,
  isTimedOut: false,
}

describe('DocumentPackageRow', () => {
  afterEach(cleanup)

  it('renders the document status and current marker', () => {
    render(
      <DocumentPackageRow
        item={item}
        renderAction={() => <button type='button'>Visualizar</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Procuração' })).toBeDefined()
    expect(screen.getByText('Aprovado')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Visualizar' })).toBeDefined()
  })
})
