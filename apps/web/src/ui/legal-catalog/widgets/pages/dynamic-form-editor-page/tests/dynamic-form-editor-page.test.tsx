import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormEditorPage } from '../index'
import { useDynamicFormEditorPage } from '../use-dynamic-form-editor-page'

vi.mock('../use-dynamic-form-editor-page', () => ({
  useDynamicFormEditorPage: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: { children: ReactNode }) => (
    <a href='/formularios-dinamicos'>{children}</a>
  ),
}))

describe('dynamic-form-editor-page', () => {
  it('renders a localized invalid-id state without entering the editor', () => {
    vi.mocked(useDynamicFormEditorPage).mockReturnValue({} as never)
    render(
      <DynamicFormEditorPage mode='edit' dynamicFormId='not-a-uuid' isValidId={false} />,
    )
    expect(screen.getByRole('heading', { name: 'Editar formulário' })).toBeTruthy()
    expect(screen.getByText('O identificador do formulário é inválido.')).toBeTruthy()
  })
})
