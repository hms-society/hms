import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormEditorStatus } from '../index'
import { useDynamicFormEditorStatus } from '../use-dynamic-form-editor-status'

vi.mock('../use-dynamic-form-editor-status', () => ({
  useDynamicFormEditorStatus: vi.fn(),
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: { children: ReactNode }) => (
    <a href='/formularios-dinamicos'>{children}</a>
  ),
}))

describe('dynamic-form-editor-status', () => {
  it('renders a retry action for a loading error', () => {
    const onRetry = vi.fn()
    vi.mocked(useDynamicFormEditorStatus).mockReturnValue({
      status: 'error',
      onRetry,
    })

    render(
      <DynamicFormEditorStatus
        props={{ mode: 'edit', dynamicFormId: 'form-1' }}
        editor={{} as never}
      >
        <div>Editor</div>
      </DynamicFormEditorStatus>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalled()
    expect(screen.getByText('Não foi possível carregar este formulário.')).toBeTruthy()
  })
})
