import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SignatureProgressSummary } from '..'

const baseStatus = {
  status: 'sent',
  totalDocuments: 3,
  completedDocuments: 1,
  failedDocuments: 1,
  progressPercentage: 40,
} as never

describe('SignatureProgressSummary', () => {
  afterEach(cleanup)

  it('exposes aggregate counts, percentage and refresh announcement', () => {
    render(<SignatureProgressSummary status={baseStatus} isRefreshing />)

    expect(screen.getByText('1 de 3 documentos concluídos')).not.toBeNull()
    expect(screen.getByText('1 com falha')).not.toBeNull()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40')
    expect(screen.getByRole('status').textContent).toContain('Atualizando dados')
  })
})
