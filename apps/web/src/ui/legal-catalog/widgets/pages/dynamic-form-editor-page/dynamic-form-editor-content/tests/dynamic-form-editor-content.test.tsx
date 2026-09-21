import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormEditorContent } from '../index'
import { useDynamicFormEditorContent } from '../use-dynamic-form-editor-content'

vi.mock('../use-dynamic-form-editor-content', () => ({
  useDynamicFormEditorContent: vi.fn(),
}))

vi.mock('../../dynamic-form-editor-identification-card', () => ({
  DynamicFormEditorIdentificationCard: () => <div data-testid='identification-card' />,
}))
vi.mock('../../dynamic-form-editor-overlays', () => ({
  DynamicFormEditorOverlays: () => <div data-testid='editor-overlays' />,
}))
vi.mock('../../dynamic-form-field-list', () => ({
  DynamicFormFieldList: () => <div data-testid='field-list' />,
}))
vi.mock('../../dynamic-form-preview', () => ({
  DynamicFormPreview: () => <div data-testid='preview' />,
}))
vi.mock('../../dynamic-form-save-bar', () => ({
  DynamicFormSaveBar: () => <div data-testid='save-bar' />,
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: { children: ReactNode }) => (
    <a href='/formularios-dinamicos'>{children}</a>
  ),
}))

describe('dynamic-form-editor-content', () => {
  it('renders the editor heading and validation feedback', () => {
    vi.mocked(useDynamicFormEditorContent).mockReturnValue({
      editor: {
        saveState: { kind: 'dirty', isValid: false },
        availabilityError: null,
      } as never,
      draft: { fields: [] } as never,
      title: 'Novo formulário',
      canDelete: false,
      validationMessage: 'Preencha os campos obrigatórios.',
      openFieldByClientId: vi.fn(),
    })

    render(<DynamicFormEditorContent props={{ mode: 'create' }} editor={{} as never} />)

    expect(screen.getByRole('heading', { name: 'Novo formulário' })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain(
      'Preencha os campos obrigatórios.',
    )
  })
})
