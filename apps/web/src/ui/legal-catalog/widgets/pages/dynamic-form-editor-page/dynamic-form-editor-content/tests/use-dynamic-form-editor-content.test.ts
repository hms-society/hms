import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormEditorContent } from '../use-dynamic-form-editor-content'

describe('use-dynamic-form-editor-content', () => {
  it('derives the title and opens an existing field by client ID', () => {
    const openField = vi.fn()
    const editor = {
      draft: {
        name: 'Triagem',
        legalAreaId: 'area-1',
        legalTopicIds: ['topic-1'],
        fields: [{ clientId: 'field-1' }],
      },
      detailQuery: { data: { form: { name: 'Triagem' } } },
      openField,
    }
    const { result } = renderHook(() =>
      useDynamicFormEditorContent({
        props: { mode: 'edit', dynamicFormId: 'form-1' },
        editor,
      } as never),
    )

    expect(result.current.title).toBe('Triagem')
    expect(result.current.validationMessage).toBeNull()
    act(() => result.current.openFieldByClientId('field-1'))
    expect(openField).toHaveBeenCalledWith('edit', 0)
  })
})
