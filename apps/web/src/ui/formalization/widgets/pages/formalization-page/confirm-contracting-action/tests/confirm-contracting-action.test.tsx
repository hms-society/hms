import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FormalizationSignatureSendingStatusResponse } from '@hms/core/formalization/domain/structures'

import { ConfirmContractingAction } from '..'

const status: FormalizationSignatureSendingStatusResponse = {
  formalizationId: 'formalization-1',
  formalizationStatus: 'in_progress',
  canConfirmContracting: true,
  formalizationVersion: 8,
  version: 9,
  requestId: 'request-1',
  status: 'confirmed',
  totalDocuments: 1,
  completedDocuments: 1,
  failedDocuments: 0,
  progressPercentage: 100,
  canCancel: false,
  canRetry: false,
  viewerMode: 'operator',
  permissions: { canOperate: true, canViewDocumentContent: true },
  documents: [],
}

describe('ConfirmContractingAction', () => {
  afterEach(cleanup)

  it('gates the green action until readiness is supplied and opens confirmation', () => {
    const onConfirm = vi.fn().mockResolvedValue({})
    const { rerender } = render(
      <ConfirmContractingAction
        intakeVersion={12}
        status={{ ...status, canConfirmContracting: false }}
        isLoading={false}
        isPending={false}
        error={null}
        onConfirm={onConfirm}
      />,
    )
    expect(
      (screen.getByRole('button', { name: 'Confirmar contratação' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)

    rerender(
      <ConfirmContractingAction
        intakeVersion={12}
        status={status}
        isLoading={false}
        isPending={false}
        error={null}
        onConfirm={onConfirm}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar contratação' }))
    expect(screen.getByRole('alertdialog').textContent).toContain(
      'Nenhum caso será criado',
    )
  })

  it('shows pending and error feedback in the confirmation surface', () => {
    cleanup()
    render(
      <ConfirmContractingAction
        intakeVersion={12}
        status={status}
        isLoading={false}
        isPending={false}
        error={new Error('conflict')}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Confirmar contratação' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar contratação' }))
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível confirmar')
    cleanup()
    render(
      <ConfirmContractingAction
        intakeVersion={12}
        status={status}
        isLoading={false}
        isPending
        error={null}
        onConfirm={vi.fn()}
      />,
    )
    expect(
      (screen.getByRole('button', { name: 'Confirmar contratação' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
