import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormEditorIdentificationCard } from '../index'
import { useDynamicFormEditorIdentificationCard } from '../use-dynamic-form-editor-identification-card'

vi.mock('../use-dynamic-form-editor-identification-card', () => ({
  useDynamicFormEditorIdentificationCard: vi.fn(),
}))

describe('dynamic-form-editor-identification-card', () => {
  it('renders the identification fields from its hook state', () => {
    vi.mocked(useDynamicFormEditorIdentificationCard).mockReturnValue({
      editor: { updateDraft: vi.fn(), toggleAvailability: vi.fn() } as never,
      draft: {
        name: 'Triagem inicial',
        stage: 'consultation',
        legalAreaId: '',
        legalTopicIds: [],
        description: '',
        fields: [],
      },
      form: undefined,
      areas: [],
      topics: [],
      selectedTopics: [],
      topicsOpen: false,
      setTopicsOpen: vi.fn(),
      canToggleAvailability: false,
      toggleTopic: vi.fn(),
      handleTopicsTriggerKeyDown: vi.fn(),
      isTopicsPending: false,
    })

    render(
      <DynamicFormEditorIdentificationCard
        props={{ mode: 'create' }}
        editor={{} as never}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Identificação e aplicabilidade' }),
    ).toBeTruthy()
    expect(
      (screen.getByLabelText('Nome do formulário *') as HTMLInputElement).value,
    ).toBe('Triagem inicial')
  })
})
