import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormEditorIdentificationCard } from '../use-dynamic-form-editor-identification-card'

describe('use-dynamic-form-editor-identification-card', () => {
  it('toggles a topic through the editor draft updater', () => {
    const updateDraft = vi.fn()
    const { result } = renderHook(() =>
      useDynamicFormEditorIdentificationCard({
        props: { mode: 'create' },
        editor: {
          draft: {
            legalTopicIds: ['topic-1'],
          },
          detailQuery: { data: undefined },
          areasQuery: { data: [] },
          topicsQuery: {
            data: [{ id: 'topic-1', name: 'Família', active: true }],
            isPending: false,
          },
          isDirty: false,
          availabilityPending: false,
          updateDraft,
        } as never,
      }),
    )

    act(() => result.current.toggleTopic('topic-1'))
    expect(updateDraft).toHaveBeenCalledWith('legalTopicIds', [])
  })
})
