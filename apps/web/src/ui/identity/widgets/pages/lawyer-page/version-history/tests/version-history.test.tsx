import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { VersionHistory } from '../index'

describe('VersionHistory', () => {
  afterEach(cleanup)

  it('marks the newest version as current independently from the selected version', () => {
    render(
      <VersionHistory
        versions={[
          {
            id: 'v1',
            versionNumber: 1,
            status: 'in_review',
            createdAt: '2026-09-25T19:10:00.000Z',
          },
          {
            id: 'v2',
            versionNumber: 2,
            status: 'in_review',
            createdAt: '2026-09-25T19:12:00.000Z',
          },
        ]}
        currentVersionId='v2'
        selectedVersionId='v1'
        onSelectVersion={() => undefined}
      />,
    )

    const currentTag = screen.getByText('(Atual)')
    expect(currentTag.parentElement?.textContent).toContain('v2')
    expect(
      screen
        .getByRole('button', { name: 'Visualizar versão v1' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
    expect(
      screen
        .getByRole('button', { name: 'Visualizar versão v2' })
        .getAttribute('aria-pressed'),
    ).toBe('false')
  })
})
