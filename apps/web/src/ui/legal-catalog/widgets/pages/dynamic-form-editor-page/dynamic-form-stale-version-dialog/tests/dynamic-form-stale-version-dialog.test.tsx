import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormStaleVersionDialog } from '../index'

describe('dynamic-form-stale-version-dialog', () => {
  it('delegates server-version reload and keeps its accessible warning', () => {
    const onReloadServerVersion = vi.fn().mockResolvedValue(undefined)
    render(
      <DynamicFormStaleVersionDialog
        open
        expectedVersion={1}
        currentVersion={2}
        isReloading={false}
        errorMessage='Falha ao recarregar'
        onContinueEditing={vi.fn()}
        onReloadServerVersion={onReloadServerVersion}
      />,
    )
    expect(screen.getByRole('alert').textContent).toContain('Falha ao recarregar')
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar versão do servidor' }))
    expect(onReloadServerVersion).toHaveBeenCalledOnce()
  })
})
